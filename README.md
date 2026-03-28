# PoGo-Bonfire

PoGo-Bonfire is a lightweight Pokémon GO friend directory built with Next.js App Router, Zustand, IndexedDB, and a Google Sheet backend.

## Features

- Offline-first CSV sync with a 12-hour IndexedDB cache
- Instant in-memory search by IGN, contact method, or tags
- Watchlist notifications when a previously missing IGN appears
- Serverless registration route with validation, duplicate checking, and Google Sheets append
- Basic PWA manifest and service worker registration

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the Google Sheet values.
3. Ensure the target Google Sheet is readable by the public for CSV export and editable by the service account email.
4. Run `npm run dev`.

## Sheet Columns

The app expects the sheet columns in this order:

1. `IGN`
2. `Friend Code`
3. `Contact Link`
4. `Contact Method`
5. `Tags`
6. `Created At`

Tags can be a comma-separated list in the sheet CSV.
