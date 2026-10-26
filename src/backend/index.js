import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { CATEGORIES, coordinates, normalizePlaces } from '../shared/tourism.js'

const app = new Hono()

// Logger Middleware
app.use('*', logger())

// Enable CORS
app.use(
  '*',
  cors({
    origin: (origin, c) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        // If your frontend runs on a different local port (e.g. 5174),
        // add it here like: 'http://localhost:5174'

        // ⚠️ DEV_DOMAIN and PROD_DOMAIN are injected via Cloudflare env vars.
        // These values are available at runtime once your component is
        // published and approved. Do NOT remove them — they are required
        // for deployed environments to work correctly.
        c.env.DEV_DOMAIN,
        c.env.STAGING_DOMAIN,
        c.env.PROD_DOMAIN,
      ].filter(Boolean) 

      return allowedOrigins.includes(origin) ? origin : null
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
)


app.get('/api/health', c => c.json({ ok: true, configured: Boolean(c.env.GEOAPIFY_API_KEY) }))

app.get('/api/places', async c => {
  const { lat, lon, category = 'all', radius = '5000' } = c.req.query()
  if (!coordinates(lat, lon) || !Object.hasOwn(CATEGORIES, category) || !['2000', '5000', '10000', '20000'].includes(radius)) {
    return c.json({ error: 'Provide valid latitude, longitude, category and radius (2000, 5000, 10000 or 20000).' }, 400)
  }
  if (!c.env.GEOAPIFY_API_KEY) return c.json({ error: 'Live search is not configured. Add GEOAPIFY_API_KEY to the backend environment.', code: 'MISSING_KEY' }, 503)
  const url = new URL('https://api.geoapify.com/v2/places')
  url.search = new URLSearchParams({ categories: CATEGORIES[category].api, filter: `circle:${lon},${lat},${radius}`, bias: `proximity:${lon},${lat}`, limit: '20', lang: 'en', apiKey: c.env.GEOAPIFY_API_KEY }).toString()
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(12000) })
    if (!response.ok) return c.json({ error: response.status === 429 ? 'The places service is busy. Please try again shortly.' : 'The places service could not complete this request.', code: 'UPSTREAM_ERROR' }, response.status === 429 ? 429 : 502)
    const data = await response.json()
    if (!Array.isArray(data.features)) throw new Error('Invalid response')
    const center = { lat: Number(lat), lon: Number(lon) }
    return c.json({ places: normalizePlaces(data.features, center, category, Number(radius)), center, category, radius: Number(radius), fetchedAt: new Date().toISOString(), source: 'Geoapify / OpenStreetMap' })
  } catch (error) {
    return c.json({ error: ['TimeoutError', 'AbortError'].includes(error.name) ? 'The places service timed out. Please retry.' : 'Unable to reach the places service. Please retry.', code: 'UPSTREAM_UNAVAILABLE' }, 502)
  }
})

export default app
