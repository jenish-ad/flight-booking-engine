# Voyage frontend

Flight search interface built with Next.js, React, TypeScript, and Tailwind CSS.

## Development

Run `npm install`, then `npm run dev` and open http://localhost:3000.

Start the FastAPI backend separately. The frontend uses http://localhost:8000
by default. Set `FLIGHT_API_URL` in `.env.local` to use another backend.

Searches require three-letter airport codes, a departure date, and a traveler
count. The backend currently supports one-way flights only.

## Checks

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
