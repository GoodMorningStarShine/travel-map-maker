# Travel Map Maker

A small one-page map-making app for learning Codex, GitHub, local development, Docker, and eventually agentic travel-planning workflows.

## Run Locally

```powershell
node server.mjs
```

Then open http://localhost:5173.

If `npm` is available on your machine, `npm run dev` works too.

## What It Does

- Opens an interactive OpenStreetMap map.
- Drops pins by clicking the map.
- Names pins from the sidebar input.
- Saves places in the browser.
- Exports and imports map data as JSON.

## Docker

```powershell
docker build -t travel-map-maker .
docker run --rm -p 8080:8080 travel-map-maker
```

Then open http://localhost:8080.

## Next Ideas

- Search for places.
- Add categories and colors for pins.
- Group saved places by trip day.
- Draw routes between pins.
- Generate itinerary notes from saved places.
