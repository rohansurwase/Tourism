# Fieldnotes — Tourism Explorer

A standalone hyperDart component that turns a travel query into a small, useful collection of real sights and a pocket day plan. Built from the provided **React + Vite + Hono** template.

## Quick start

Requires Node.js 22.12+ and npm. Run these commands from this folder:

```sh
npm ci
npm --prefix src/backend ci
cp .env.example .env
cp src/backend/.dev.vars.example src/backend/.dev.vars
```

On Windows PowerShell, use `Copy-Item` instead of `cp`. Edit `src/backend/.dev.vars` and replace the placeholder with your Geoapify key. Get a key from https://myprojects.geoapify.com/. Do not put it in a `VITE_` variable or frontend file.

Run these in two terminals:

```sh
npm run dev:backend
```

```sh
npm run dev
```

- Frontend / official hyperDart sandbox: http://localhost:5173/
- Direct component preview: http://localhost:5173/preview.html
- Backend health: http://localhost:3001/api/health
- Backend configuration: `src/backend/.dev.vars`
- Frontend backend address: `.env` (`VITE_API_URL=http://127.0.0.1:3001`)

The preview contains seven example queries and a sidebar toggle. Without a key or backend, a clear error is shown and the user can explicitly open a labelled Paris demo. Demo fixtures never masquerade as live API results and are never used as an automatic fallback. The demo exists for UI exploration, not as evidence of live API success.

## What works

- Object or array `searchData`, reading `entities[].entityInfo.geo.lat/long`.
- Categories inferred from query words: museums, temples, monuments, forts/castles, parks, viewpoints, historic sites/landmarks; broad tourism requests default to all sights.
- Recognised `queryProps.filters.category` can supply the structured category.
- Radius controls: 2, 5, 10 and 20 km around the resolved location centre.
- Server-only Geoapify requests, longitude first, maximum 20 places per request.
- Category allowlists, commercial-place exclusion, deduplication and radius checks.
- Named sights, type, address, straight-line distance, source descriptions and reported hours when available. No invented ratings, opening status or visiting times.
- Directions and validated HTTP(S) website links.
- Loading, missing location, no results, bad configuration, API failures and retry.
- Mainline and narrow sidebar layouts, platform/system theme support and a manual light/dark toggle.
- Relative-position diagram in mainline; intentionally labelled as not a street map.
- Six-stop day plan, manual reordering, nearest-next ordering and text export.
- Cancellation of stale searches and one `componentLoaded()` notification after the initial result/error state renders.

## Design idea

Fieldnotes uses a travel-notebook aesthetic: paper colours, editorial type, numbered sights, green ink and a small yellow travel stamp. Cards answer “what, where, how far?” without relying on unlicensed photos. The mainline layout includes an orientation diagram; sidebar removes this secondary view while retaining all core actions. Each plan is intentionally limited to six stops to encourage a manageable shortlist.

Results are **nearest first**, not a claimed popularity ranking. Query words such as “best” trigger discovery but do not imply access to ratings or authoritative rankings.

## Architecture and files

```text
src/frontend/index.jsx       Existing withHD entry point
src/frontend/NewComponent.jsx UI, fetch lifecycle, day-plan interactions
src/frontend/tourism.css      Scoped responsive light/dark styles
src/frontend/demo.js          Explicitly labelled Paris fixtures
src/shared/tourism.js         Query parsing, normalisation, distances, ordering
src/backend/index.js          Hono API and unchanged template CORS middleware
src/backend/.dev.vars.example Backend secret example, never an actual key
src/backend/esbuild.config.js Unchanged backend builder
src/backend/wrangler.jsonc    Worker configuration
src/sandbox/                 Unchanged official sandbox
src/preview.jsx               Local direct-preview harness (not library entry)
preview.html                  Local direct-preview page
searchData.json               Official sandbox example entity
resource.json                 Tourism query schema
hyperdart.config.js           Keywords, regexes and submission fields
scripts/validate-publish.js   Unchanged required publish validation
vite.config.js                Unchanged template build configuration
index.html                    Unchanged sandbox entry
package-lock.json             Locked frontend dependencies
src/backend/package-lock.json Locked backend dependencies
tests/                       Logic and Hono API tests
docs/                        Demo walkthrough, verification and submission guide
```

Flow: hyperDart entity → frontend query/category/radius → Hono `/api/places` → Geoapify → validated, normalised JSON → cards and day plan. No database or LLM is needed. A deterministic category parser is inexpensive and explainable in a live review. `withHD` remains the only router wrapper. The production frontend uses `props.deployedBackendURL`.

## API

`GET /api/places?lat=28.6139&lon=77.2090&category=museums&radius=5000`

Success returns `{ places, center, category, radius, fetchedAt, source }`. Each place includes `id`, `name`, `lat`, `lon`, `distance` (km), `kind`, `address`, `description`, `website`, `hours`, `categories`. Invalid inputs return 400; missing key 503; upstream throttling 429; other upstream failures 502. The upstream timeout is 12 seconds, with a 15-second client limit. Errors do not return the upstream request URL or key.

`GET /api/health` returns `{ ok, configured }` without exposing the key.

## Data sources and libraries

- [Geoapify Places API](https://apidocs.geoapify.com/docs/places/) for real attractions and available metadata; OpenStreetMap is its underlying source. Attribution links are rendered in the component.
- [Geoapify category reference](https://apidocs.geoapify.com/docs/places/#categories) for strict tourism category mappings.
- Google Maps direction links are external navigation handoffs, not an integrated routing service.
- React for UI/state, Vite for the template library bundle, Hono for the Worker API, Wrangler/esbuild for backend development/build, and the template's hyperDart SDKs. No additional runtime libraries were needed. Tests use Node’s test runner, jsdom, React Testing Library and esbuild.
- Haversine distance is straight-line distance. Nearest-next ordering is a greedy suggestion, not an optimal itinerary or walkable route.

## Test and build

```sh
npm test
npm run build
npm run validate
```

See `docs/VERIFICATION.md` for what was actually verified and remaining external checks. Build outputs are generated in `dist/`; they and dependencies are excluded from source control and the source ZIP. Run the build locally before publishing.

The backend build script supplied by the template uses `cp`; on Windows run the build in Git Bash or WSL. Do not change the protected template builder merely to bypass this requirement.

## Submission and publishing

See `docs/SUBMISSION.md`. The project is implemented, but submission requires your real public GitHub repository, a 2–3 minute YouTube demo, Geoapify secret provisioning and hyperDart Partner Portal credentials. These cannot be fabricated. `github` and `demovideo` are intentionally empty in `hyperdart.config.js`, so the original validation correctly blocks publication until you fill them.

## Limitations and engineering trade-offs

- Geoapify/OSM completeness varies. Strictly filtering tourism prevents unrelated primary results but can omit genuine attractions with incomplete tags. Temples use the precise temple category, not all religious buildings.
- At most one 20-result provider response per search. Filtering can produce fewer than 20 items. Results are neither exhaustive nor ranked by popularity.
- Searches use a radius around the entity coordinates, not administrative boundaries. This is particularly relevant for countries/states.
- No opening-hours interpretation, live weather, routing engine, ticket prices, geolocation request or photo service is claimed.
- Descriptions/hours are shown only if supplied; otherwise the UI says they are unavailable.
- Plan state persists only while mounted and clears when the location or live/demo mode changes.
- The diagram is an orientation aid; marker overlap is possible and keyboard-accessible cards remain the primary interaction.
- This version has no durable quota/rate limiter or shared cache. For broad public traffic, add edge rate limiting and caching before scaling; CORS alone is not authentication.

## AI assistance and authorship

This implementation was produced with OpenAI Codex assistance, continuing the provided template. Codex implemented the component, scoped styles, category/data utilities, Hono places route, tests, configuration and documentation. Protected sandbox/build/validation files and the original CORS middleware were retained. The project owner should review the code, configure credentials, perform live provider/platform checks and record the demo. Do not claim manual implementation or tests you have not personally performed.
# Tourism
