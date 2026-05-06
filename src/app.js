const STORAGE_KEY = "travel-map-maker:places";
const MIN_VISIBLE_SLOTS = 6;
const MAX_STOPS = 12;
const AVERAGE_TRAVEL_SPEED_MPH = 45;

const initialView = {
  center: [39.8283, -98.5795],
  zoom: 4,
};

const placeNameInput = document.querySelector("#place-name");
const placesList = document.querySelector("#places-list");
const placeCount = document.querySelector("#place-count");
const exportButton = document.querySelector("#export-map");
const importInput = document.querySelector("#import-map");
const clearButton = document.querySelector("#clear-map");

const map = L.map("map", {
  zoomControl: false,
}).setView(initialView.center, initialView.zoom);

L.control.zoom({ position: "bottomright" }).addTo(map);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

let places = loadPlaces();
let markers = new Map();

renderPlaces();

map.on("click", (event) => {
  if (places.length >= MAX_STOPS) {
    placeNameInput.value = "";
    return;
  }

  const typedName = placeNameInput.value.trim();
  const place = {
    id: crypto.randomUUID(),
    name: typedName || `Destination ${places.length + 1}`,
    lat: Number(event.latlng.lat.toFixed(6)),
    lng: Number(event.latlng.lng.toFixed(6)),
    createdAt: new Date().toISOString(),
  };

  places = [...places, place];
  placeNameInput.value = "";
  savePlaces();
  renderPlaces();
});

exportButton.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ places }, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "travel-map.json";
  link.click();
  URL.revokeObjectURL(url);
});

importInput.addEventListener("change", async () => {
  const file = importInput.files?.[0];
  if (!file) return;

  const text = await file.text();
  const data = JSON.parse(text);
  if (!Array.isArray(data.places)) {
    throw new Error("Imported map must include a places array.");
  }

  places = data.places
    .filter((place) => typeof place.lat === "number" && typeof place.lng === "number")
    .slice(0, MAX_STOPS)
    .map((place) => ({
      id: place.id || crypto.randomUUID(),
      name: String(place.name || "Untitled place"),
      lat: place.lat,
      lng: place.lng,
      createdAt: place.createdAt || new Date().toISOString(),
    }));

  importInput.value = "";
  savePlaces();
  renderPlaces();
});

clearButton.addEventListener("click", () => {
  if (places.length === 0) return;
  places = [];
  savePlaces();
  renderPlaces();
});

function loadPlaces() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function savePlaces() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
}

function renderPlaces() {
  for (const marker of markers.values()) {
    marker.remove();
  }
  markers = new Map();

  placesList.innerHTML = "";
  placeCount.textContent = `${places.length}/${MAX_STOPS}`;

  places.forEach((place) => {
    const marker = L.marker([place.lat, place.lng])
      .addTo(map)
      .bindPopup(`<strong>${escapeHtml(place.name)}</strong><br>${place.lat}, ${place.lng}`);
    markers.set(place.id, marker);

    const item = document.createElement("li");
    item.className = "destination-card";
    item.innerHTML = `
      <span class="stop-number">${markers.size}</span>
      <div>
        <strong>${escapeHtml(place.name)}</strong>
        <span class="coordinates">${place.lat}, ${place.lng}</span>
      </div>
      <button class="remove-place" type="button" aria-label="Remove ${escapeHtml(place.name)}">x</button>
    `;

    item.querySelector(".remove-place").addEventListener("click", () => {
      places = places.filter((savedPlace) => savedPlace.id !== place.id);
      savePlaces();
      renderPlaces();
    });

    item.querySelector("div").addEventListener("click", () => {
      map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 8));
      marker.openPopup();
    });

    placesList.append(item);

    const nextPlace = places[places.indexOf(place) + 1];
    if (nextPlace) {
      placesList.append(createRouteLeg(place, nextPlace));
    }
  });

  const visibleSlots = Math.min(MAX_STOPS, Math.max(MIN_VISIBLE_SLOTS, places.length + 1));
  for (let slot = places.length + 1; slot <= visibleSlots; slot += 1) {
    if (slot > MAX_STOPS) break;
    const item = document.createElement("li");
    item.className = "destination-card destination-card-empty";
    item.innerHTML = `
      <span class="stop-number">${slot}</span>
      <div>
        <strong>Open destination</strong>
        <span class="coordinates">Click the map to fill this stop</span>
      </div>
    `;
    placesList.append(item);
  }

  if (places.length > 0) {
    const bounds = L.latLngBounds(places.map((place) => [place.lat, place.lng]));
    map.fitBounds(bounds.pad(0.25), { maxZoom: 10 });
  }
}

function createRouteLeg(start, end) {
  const distance = getDistanceMiles(start, end);
  const minutes = Math.round((distance / AVERAGE_TRAVEL_SPEED_MPH) * 60);
  const item = document.createElement("li");
  item.className = "route-leg";
  item.innerHTML = `
    <span>${formatDistance(distance)}</span>
    <span>${formatTravelTime(minutes)}</span>
  `;
  return item;
}

function getDistanceMiles(start, end) {
  const earthRadiusMiles = 3958.8;
  const startLat = toRadians(start.lat);
  const endLat = toRadians(end.lat);
  const latDelta = toRadians(end.lat - start.lat);
  const lngDelta = toRadians(end.lng - start.lng);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

function formatDistance(distance) {
  if (distance < 10) return `${distance.toFixed(1)} mi`;
  return `${Math.round(distance)} mi`;
}

function formatTravelTime(minutes) {
  if (minutes < 60) return `${Math.max(1, minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}
