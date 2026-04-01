# PoGo-Bonfire

PoGo-Bonfire is a progressive web app for Pokemon GO players to find a safe way to reconnect with in-game friends using IGN-based discovery. The app is optimized for low cost, high read performance, and resilient writes under burst traffic.

It uses a split architecture:

- a client-heavy read path powered by public Google Sheets exports, IndexedDB caching, and a Web Worker for search/filter/sort work
- a protected write path powered by a Next.js serverless API, Upstash Redis lazy batching, and Google Sheets bulk appends

<img width="2098" height="2907" alt="image" src="https://github.com/user-attachments/assets/d284279c-d84a-4b0f-af55-4f129275ea58" />

## Current Architecture

### Read path

- The player directory is sourced from a public Google Sheet.
- The app tries the live Google CSV first with a 2 second circuit breaker timeout.
- If Google is slow or unavailable, the app falls back to a jsDelivr CDN CSV snapshot stored in the repository.
- Parsed records are cached in IndexedDB for 12 hours.
- Registration metadata is loaded from a second public Google Sheet CSV and cached for 1 month.
- Filtering, searching, and sorting are offloaded to a Web Worker so the main thread stays responsive.

### Write path

- Registrations are validated in `/api/register`.
- The API uses Upstash Redis as a synchronous lazy-batching queue.
- Duplicate prevention is handled with an atomic Redis `SADD` into `pogo_registered_igns`.
- New registrations are added to `pogo_registration_queue`.
- When queue size or time thresholds are met, the request that acquires the lock flushes the queue to Google Sheets in bulk.
- Queue handoff uses Redis `RENAME` so new registrations can continue writing safely while a batch is being processed.
- If Google Sheets fails, the batch is pushed back to the queue so data is not lost.

## Main Features

- Floating bottom navigation with `Home`, `Search`, `Wishlist`, `FAQ`, and theme toggle
- Light and dark theme support with persisted theme selection
- Offline-friendly client caching with IndexedDB
- Web Worker powered search, filtering, and sorting
- Infinite scrolling results on `/search`
- Multi-select tag filtering
- Persisted search sort preference
- Device-local self-registration state that replaces the form with a `(YOU)` player card after successful registration
- Wishlist management with local persistence and match detection on fresh syncs
- Metadata-driven contact methods and tags from an admin sheet
- Player cards with friend-code copy action, contact rendering by contact kind, and structured Correct/Report dialogs
- CDN fallback snapshot sync via GitHub Actions

## App Routes

- `/`
  - shows total trainer count
  - surfaces newly added trainers
  - contains the registration flow or the saved `(YOU)` card
- `/search`
  - IGN/text search
  - contact-method filtering
  - multi-tag filtering
  - sorting: `A to Z`, `Z to A`, `Recent first`, `Oldest first`
  - infinite scroll in pages of 20
- `/wishlist`
  - shows locally saved wishlist IGNs
  - allows adding a new wishlist IGN directly
  - shows matches found after directory syncs
- `/faq`
  - static help and usage guidance

## Data Flow

### Directory sync flow

1. App boot reads cached directory, metadata, wishlist, self-registration, and sort preference from IndexedDB.
2. Metadata is reused if it is younger than 1 month; otherwise it is fetched again from the admin metadata sheet.
3. Directory data is reused if it is non-empty and younger than 12 hours.
4. If the directory cache is stale or missing, the app fetches the live Google CSV with a 2 second timeout.
5. If the primary fetch fails or times out, the app fetches the CDN fallback CSV.
6. Parsed player records hydrate Zustand state.
7. The raw dataset and current filters are sent to a Web Worker, which computes filtered and sorted results.
8. Wishlist entries are cross-checked against the fresh directory and surfaced as local matches.

### Registration flow

1. User submits:
   - `IGN`
   - optional `Friend Code`
   - `Contact ID`
   - manually selected `Contact Method`
   - 0 to 3 tag indexes
2. The contact value is materialized from metadata using the configured pattern.
3. The API validates the payload and normalizes the IGN.
4. The API attempts `SADD pogo_registered_igns normalizedIgn`.
5. If Redis returns `0`, the IGN is already registered and the API returns `409 Conflict`.
6. If Redis returns `1`, the record is pushed into `pogo_registration_queue`.
7. The API checks:
   - queue length `> 50`
   - or time since `last_sheet_sync` `> 5 minutes`
8. If neither threshold is met, the API returns `200 OK` immediately.
9. If a threshold is met, the API tries to acquire `sync_lock` with a 15 second TTL.
10. If lock acquisition fails, another request is already flushing, so the API returns `200 OK`.
11. If lock acquisition succeeds:

- the queue is atomically renamed to `pogo_queue_processing`
- the batch is read
- rows are bulk appended to Google Sheets
- on success, the processing queue is deleted and `last_sheet_sync` is updated
- on failure, items are pushed back to the front of the main queue in FIFO order

12. The lock is always released in a `finally` block.

## Contact Metadata Model

Registration metadata comes from the public metadata sheet. It supports two contact kinds:

- `link_contact`
  - stored value becomes a fully materialized URL
  - rendered on the player card as a normal anchor opening in a new tab
- `id_contact`
  - stored value becomes a username or handle
  - rendered on the player card as a copy button

Example metadata rows:

```text
kind,key,label,pattern,index
link_contact,reddit,Reddit,https://www.reddit.com/u/{USERNAME},
id_contact,discord,Discord,{USERNAME},
link_contact,twitch,Twitch,https://www.twitch.tv/{USERNAME},
link_contact,guilded,Guilded,https://www.guilded.gg/{USERNAME},
id_contact,campfire,Campfire,@{USERNAME},
tag,,#SendGiftsEveryday,,0
tag,,#OpenGiftsEveryday,,1
tag,,#WantForeverFriends,,2
tag,,#DoWeeklyChallenges,,3
```

The app replaces `{USERNAME}` with the submitted `Contact ID`.

## Google Sheets Schema

### Main directory sheet

The main directory sheet should expose these columns:

```text
IGN
Friend Code
Contact Link
Contact Method
Contact Kind
Tags
Created At
```

Notes:

- `Tags` stores numeric indexes as a comma-separated string, for example `0,2,3`
- `Contact Method` stores the stable contact key, for example `reddit` or `discord`
- `Contact Kind` stores either `link_contact` or `id_contact`

### Metadata sheet

The metadata sheet should expose these columns:

```text
kind,key,label,pattern,index
```

`contact` options are defined by `kind`, `key`, `label`, and `pattern`. Tags are defined by `kind=tag`, `label`, and `index`.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```env
NEXT_PUBLIC_SHEET_CSV_URL=https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=0
NEXT_PUBLIC_REGISTRATION_META_CSV_URL=https://docs.google.com/spreadsheets/d/YOUR_META_SHEET_ID/export?format=csv&gid=0
NEXT_PUBLIC_ADMIN_EMAIL=admin@pogobonfire.com
UPSTASH_REDIS_REST_URL=https://your-upstash-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
GOOGLE_SHEET_ID=your_google_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

What they do:

- `NEXT_PUBLIC_SHEET_CSV_URL`
  - primary public directory CSV source used by the client
- `NEXT_PUBLIC_REGISTRATION_META_CSV_URL`
  - public admin-managed metadata CSV for contact methods and tags
- `NEXT_PUBLIC_ADMIN_EMAIL`
  - used for Correct/Report mail drafts
- `UPSTASH_REDIS_REST_URL`
  - Redis endpoint for duplicate prevention, queueing, sync lock, and timestamps
- `UPSTASH_REDIS_REST_TOKEN`
  - Redis auth token
- `GOOGLE_SHEET_ID`
  - target spreadsheet for batched writes
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - service account identity used by the serverless function
- `GOOGLE_PRIVATE_KEY`
  - private credential used to authenticate with the Google Sheets API

## Local Development

### Prerequisites

- Node.js 18+
- npm
- a Google Sheet for the public directory
- a Google Sheet for public registration metadata
- a Google Cloud service account with write access to the main sheet
- an Upstash Redis database

### Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`

3. Run the app:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## CDN Fallback Sync

The repository includes a GitHub Actions workflow at `.github/workflows/sync-directory.yml` that:

- runs every 2 hours
- can be triggered manually with `workflow_dispatch`
- downloads the public directory CSV
- stores it at `public/data/fallback-directory.csv`
- commits changes back to `main`

This file is used as the jsDelivr fallback source when the primary Google Sheets read path is slow or unavailable.

## Moderation Flow

Player cards expose `Correct` and `Report` actions.

- `Correct`
  - for typos or human mistakes
- `Report`
  - for invalid, misleading, or unrelated data

Both open a full-screen dialog that generates a structured email draft via `mailto:`. Browsers cannot reliably attach local files directly into Gmail or Outlook from the web app, so the draft reminds the user to manually attach any image or video evidence they selected.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Zustand
- idb-keyval
- Papa Parse
- Web Worker
- Upstash Redis
- googleapis
- GitHub Actions

## Notes

- The directory read path is optimized for fast client-side search and low infrastructure cost.
- The write path is optimized for burst protection and Google Sheets API survivability.
- Duplicate prevention is enforced server-side with Redis and does not rely on client-side state.
