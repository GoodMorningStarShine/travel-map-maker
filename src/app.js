const STORAGE_KEY = "travel-map-maker:places";

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
  const typedName = placeNameInput.value.trim();
  const place = {
    id: crypto.randomUUID(),
    name: typedName || `Place ${places.length + 1}`,
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
  placeCount.textContent = String(places.length);

  places.forEach((place) => {
    const marker = L.marker([place.lat, place.lng])
      .addTo(map)
      .bindPopup(`<strong>${escapeHtml(place.name)}</strong><br>${place.lat}, ${place.lng}`);
    markers.set(place.id, marker);

    const item = document.createElement("li");
    item.className = "place-card";
    item.innerHTML = `
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
  });

  if (places.length > 0) {
    const bounds = L.latLngBounds(places.map((place) => [place.lat, place.lng]));
    map.fitBounds(bounds.pad(0.25), { maxZoom: 10 });
  }
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
