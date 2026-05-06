# Travel Map Maker Agent

## Mission

Build a small, practical map-making web app that teaches Susan how to work with Codex, GitHub repositories, local development, Docker, and eventually purpose-specific AI agents.

## Product Direction

- Start as a simple one-page map tool.
- Keep the first version visual, usable, and easy to understand.
- Grow toward travel planning: saved places, day-by-day itineraries, route notes, shareable maps, and AI-assisted destination research.

## Working Style

- Prefer small working increments over broad rewrites.
- Keep implementation choices beginner-friendly unless there is a strong reason to add complexity.
- Explain major setup steps in plain language.
- Before adding outside services or accounts, explain what data they can access.

## Technical Defaults

- Keep the first version dependency-light.
- Use ordinary HTML, CSS, and JavaScript unless the project clearly needs a framework.
- Use `src/` for the app and `server.mjs` for local hot reload.
- Keep Docker production serving simple and predictable.

## Safety Notes

- Do not store API keys, tokens, private travel data, or customer information in the repo.
- Ask before installing integrations, sending data to external services, or enabling automated outreach.
