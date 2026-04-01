# PoGo-Bonfire

> [!IMPORTANT]
> PoGo-Bonfire is a progressive web app for Pokemon GO players to find and reconnect with in-game friends using IGN-based discovery, while keeping infrastructure cost near zero and protecting Google Sheets from burst traffic.

<p align="center">
  <strong>Offline-friendly directory</strong> &bull;
  <strong>Web Worker powered search</strong> &bull;
  <strong>Redis-backed lazy batching</strong> &bull;
  <strong>Google Sheets as a zero-cost backend</strong>
</p>

<p align="center">
  <img width="2137" height="1128" alt="PoGo Bonfire Logo" src="https://github.com/user-attachments/assets/3ba5a4b4-11c0-4056-ab2e-4858db4b065d" />
</p>

---

## Table of Contents

- [Why This Project Exists](#why-this-project-exists)
- [Who This README Is For](#who-this-readme-is-for)
- [Product Snapshot](#product-snapshot)
- [Screenshots](#screenshots)
- [Feature Overview](#feature-overview)
- [How The System Works](#how-the-system-works)
- [Architecture Summary](#architecture-summary)
- [Data Models](#data-models)
- [Environment Variables](#environment-variables)
- [Local Development](#local-development)
- [Deployment Notes](#deployment-notes)
- [Repository Automation](#repository-automation)
- [Moderation Flow](#moderation-flow)
- [Tech Stack](#tech-stack)

---

## Why This Project Exists

Pokemon GO players often know each other only by in-game name. Most of the friends they make come from random people who share their code on Reddit groups. Once a friend is added, there is usually no reliable way to reconnect outside the game for coordinating gifts, remote trades, friendship grinding, or weekly challenges.

PoGo-Bonfire solves that gap with a fast and free public directory:

- players can register a public contact identity tied to their IGN
- other players can search instantly without creating accounts
- the app remains fast even with a large directory
- the write path is intentionally designed to survive burst traffic and Google Sheets API limits

---

## Who This README Is For

| Audience             | Start Here                                      | Why                                                             |
| -------------------- | ----------------------------------------------- | --------------------------------------------------------------- |
| End users            | [Product Snapshot](#product-snapshot)           | See what the app does and how the experience works              |
| Reviewers / auditors | [How The System Works](#how-the-system-works)   | Understand data flow, reliability strategy, and scaling choices |
| Contributors         | [Local Development](#local-development)         | Set up the project and work on it locally                       |
| Maintainers          | [Environment Variables](#environment-variables) | Configure Sheets, Redis, and metadata sources correctly         |

---

## Product Snapshot

### What users can do

| Area       | What it offers                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------- |
| Home       | View total trainer count, discover newly added players, and register your own public contact    |
| Search     | Search by IGN, filter by tags and contact method, sort results, and browse with infinite scroll |
| Wishlist   | Save missing IGNs locally and get notified when they appear in a fresh sync                     |
| FAQ        | Learn how the app works and what the contact fields mean                                        |
| Moderation | Submit structured correction or report drafts directly from each player card                    |

### UX highlights

- bottom-centered floating navigation
- light and dark theme toggle
- device-local `(YOU)` registration state
- instant client-side search with worker-based filtering and sorting
- copy-to-clipboard interactions for friend code and `id_contact` values
- resilient offline-friendly caching using IndexedDB

---

## Screenshots

### Home

<table>
  <tr>
    <td align="center">
      <img height="5024" alt="Home Unregistered" src="https://github.com/user-attachments/assets/b5ab3dbd-0d05-440c-b589-34ed621ce883" />
      <br />
      <sub>Home Unregistered</sub>
    </td>
    <td align="center">
      <img height="5024" alt="Home Registered" src="https://github.com/user-attachments/assets/69f18640-c373-4927-9ee4-ec794afd871c" />
      <br />
      <sub>Home Registered</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img height="5506" alt="Home with Wishlist Notifications" src="https://github.com/user-attachments/assets/30559326-4175-4c5c-bd84-86d163fe01d5" />
      <br />
      <sub>Home with Wishlist Notifications</sub>
    </td>
    <td align="center">
      <img height="5044" alt="Home Dark Theme" src="https://github.com/user-attachments/assets/a6ac8b7a-7b42-4db2-8513-b5b4d11cca3b" />
      <br />
      <sub>Home Dark Theme</sub>
    </td>
  </tr>
</table>

<p align="center">
  <img height="3148" alt="Home Light theme" src="https://github.com/user-attachments/assets/fadf8cdf-c752-4876-86b5-19e42969a963" />
  <br />
  <sub>Home Light Theme</sub>
</p>

### Search

<p align="center">
  <img height="15530" alt="Search" src="https://github.com/user-attachments/assets/240b8780-40e8-4ccb-a235-018d1883992c" />
  <br />
  <sub>Search</sub>
</p>

### Wishlist

<table>
  <tr>
    <td align="center">
      <img height="2284" alt="Wishlist Empty" src="https://github.com/user-attachments/assets/cf6245d9-d049-4383-a3f8-8110715f46d5" />
      <br />
      <sub>Wishlist Empty</sub>
    </td>
    <td align="center">
      <img height="3648" alt="Wishlist with 2 Matches" src="https://github.com/user-attachments/assets/bdabc266-8260-4125-83fd-42091eed51ba" />
      <br />
      <sub>Wishlist with 2 Matches</sub>
    </td>
  </tr>
</table>

### FAQ

<img width="1328" alt="Image" src="https://github.com/user-attachments/assets/73419362-7c71-4e16-80c0-b42f163527c7" />

### Architecture

![Image](https://github.com/user-attachments/assets/6963dd22-3840-4f6d-9e44-8a54d1c50504)

---

## Feature Overview

### Core experience

| Feature                 | Description                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------ |
| Offline-first directory | Cached directory and metadata make repeat visits fast and resilient                  |
| Instant search          | No network calls during search; all matching happens locally                         |
| Infinite scroll         | Search results render in chunks of 20 for smoother browsing                          |
| Multi-tag filters       | Users can browse trainers by multiple selected tags                                  |
| Persistent sort         | Search sort preference is restored from local storage and IndexedDB                  |
| Self-registration state | After successful registration, the form is replaced by a `(YOU)` card on that device |
| Wishlist matching       | Local wishlist is checked automatically whenever fresh directory data arrives        |

### Contact model

| Contact kind   | Storage format                           | UI behavior                                           |
| -------------- | ---------------------------------------- | ----------------------------------------------------- |
| `link_contact` | Fully materialized URL                   | Rendered as a standard anchor that opens in a new tab |
| `id_contact`   | Username / handle / raw contact identity | Rendered as a copy button                             |

### Operational resilience

| Protection                    | Why it exists                                           |
| ----------------------------- | ------------------------------------------------------- |
| 2 second read circuit breaker | Prevents slow Google Sheets reads from blocking the app |
| jsDelivr CSV fallback         | Keeps reads alive if Google is slow or rate-limited     |
| Redis duplicate set           | Prevents duplicate registrations in O(1) time           |
| Lazy batching queue           | Shields Google Sheets from burst write traffic          |
| Sync mutex lock               | Prevents concurrent flushes from colliding              |
| Atomic queue handoff          | Avoids data loss while a batch is being written         |

---

## How The System Works

## 1. Read path

The directory read path is optimized for fast client experience and minimal backend cost.

### Flow

1. The app boots and checks IndexedDB for:
   - directory cache
   - metadata cache
   - wishlist
   - self-registration
   - persisted sort preference
2. Registration metadata is reused for up to 1 month.
3. Directory data is reused for up to 12 hours if the cache is non-empty.
4. If the directory needs refreshing:
   - the app fetches the live Google CSV
   - an `AbortController` cancels the request after 2000ms
   - on timeout or failure, the app falls back to the jsDelivr CSV snapshot
5. The CSV is parsed into the app's standard player-record shape.
6. Raw records are stored in Zustand and IndexedDB.
7. The dataset and active filters are sent to a Web Worker for:
   - text search
   - tag filtering
   - contact-method filtering
   - sorting
8. The UI renders the current result slice with infinite scrolling.

### Why this matters

- fast repeat loads
- low bandwidth cost
- resilient fallback under viral traffic
- smoother UI because heavy list computations are off the main thread

---

## 2. Write path

The registration write path is synchronous, queue-backed, and designed to reduce direct pressure on Google Sheets.

### Flow

1. The user submits:
   - `IGN`
   - optional `Friend Code`
   - `Contact ID`
   - selected `Contact Method`
   - 0 to 3 tag indexes
2. The API validates the payload using metadata-driven rules.
3. The API normalizes the IGN.
4. The API performs an atomic duplicate gate:
   - `SADD pogo_registered_igns normalizedIgn`
   - if Redis returns `0`, the request is rejected with `409 Conflict`
5. If the IGN is new, the record is pushed into `pogo_registration_queue`.
6. The API checks two flush thresholds:
   - queue length `> 50`
   - or time since `last_sheet_sync` `> 5 minutes`
7. If neither threshold is met, the user gets `200 OK` immediately.
8. If a threshold is met, the API tries to acquire `sync_lock` with a 15 second TTL.
9. If lock acquisition fails, another request is already flushing, so the user still gets `200 OK`.
10. If lock acquisition succeeds:
    - `pogo_registration_queue` is atomically renamed to `pogo_queue_processing`
    - the batch is read from Redis
    - rows are bulk appended to Google Sheets
11. If the append succeeds:
    - `pogo_queue_processing` is deleted
    - `last_sheet_sync` is updated
12. If the append fails:
    - the batch is pushed back to the front of the main queue in FIFO order
    - the user still gets `200 OK` because the registration is safe in Redis
13. The lock is always released in a `finally` block.

> [!NOTE]
> Google Sheets is treated as the durable public directory destination, while Redis protects the write path from rate-limit spikes and duplicate race conditions.

---

## Architecture Summary

| Layer              | Responsibility                                                     | Technology                |
| ------------------ | ------------------------------------------------------------------ | ------------------------- |
| UI shell           | Routes, layout, theme toggle, forms, player cards                  | Next.js App Router, React |
| Client state       | Raw records, derived results, filters, self-registration, wishlist | Zustand                   |
| Local persistence  | Directory cache, metadata cache, wishlist, sort, self-registration | idb-keyval / IndexedDB    |
| Data processing    | Filtering, sorting, search computation                             | Web Worker                |
| Public read source | Primary live directory source                                      | Public Google Sheet CSV   |
| Read fallback      | CDN snapshot of the directory                                      | jsDelivr + GitHub Actions |
| Metadata source    | Admin-managed contact and tag config                               | Public Google Sheet CSV   |
| Write gateway      | Validation, queueing, locking, Sheets flush                        | Next.js serverless route  |
| Burst protection   | Duplicate set, queue, lock, sync timestamps                        | Upstash Redis             |
| Public data store  | Final persisted directory                                          | Google Sheets             |

### Architectural principles

- keep the read path cheap
- keep search local
- keep the write path safe under bursts
- avoid traditional auth for the current phase
- preserve data even when Google Sheets is slow or flaky

---

## Data Models

### Main directory sheet

The public directory CSV should expose these columns:

| Column           | Purpose                                          |
| ---------------- | ------------------------------------------------ |
| `IGN`            | Primary user identity in Pokemon GO              |
| `Friend Code`    | Optional 12-digit friend code                    |
| `Contact Link`   | Final materialized contact value                 |
| `Contact Method` | Stable contact key such as `reddit` or `discord` |
| `Contact Kind`   | `link_contact` or `id_contact`                   |
| `Tags`           | Comma-separated numeric indexes like `0,2,3`     |
| `Created At`     | ISO timestamp                                    |

### Metadata sheet

The admin metadata CSV should expose:

| Column    | Purpose                                   |
| --------- | ----------------------------------------- |
| `kind`    | `link_contact`, `id_contact`, or `tag`    |
| `key`     | Stable identifier such as `reddit`        |
| `label`   | UI label such as `Reddit`                 |
| `pattern` | Contact value template using `{USERNAME}` |
| `index`   | Numeric index for tags                    |

### Example metadata rows

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

### Contact transformation rule

| Input            | Metadata pattern                      | Stored `Contact Link`                     |
| ---------------- | ------------------------------------- | ----------------------------------------- |
| `SomeRedditUser` | `https://www.reddit.com/u/{USERNAME}` | `https://www.reddit.com/u/SomeRedditUser` |
| `Trainer#1234`   | `{USERNAME}`                          | `Trainer#1234`                            |
| `campfriend`     | `@{USERNAME}`                         | `@campfriend`                             |

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values below.

| Variable                                | Required | Description                                                  |
| --------------------------------------- | -------- | ------------------------------------------------------------ |
| `NEXT_PUBLIC_SHEET_CSV_URL`             | Yes      | Public Google Sheet CSV used as the primary directory source |
| `NEXT_PUBLIC_REGISTRATION_META_CSV_URL` | Yes      | Public metadata CSV for contact methods and tags             |
| `NEXT_PUBLIC_ADMIN_EMAIL`               | Yes      | Recipient for Correct / Report drafts                        |
| `UPSTASH_REDIS_REST_URL`                | Yes      | Upstash Redis REST endpoint                                  |
| `UPSTASH_REDIS_REST_TOKEN`              | Yes      | Upstash Redis REST auth token                                |
| `GOOGLE_SHEET_ID`                       | Yes      | Spreadsheet ID used for batched writes                       |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`          | Yes      | Google service account identity                              |
| `GOOGLE_PRIVATE_KEY`                    | Yes      | Google service account private key                           |

### Example

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

> [!WARNING]
> Never expose Redis credentials or the Google private key to the client. Only `NEXT_PUBLIC_*` values are safe for browser use.

---

## Local Development

### Prerequisites

| Requirement            | Notes                                                 |
| ---------------------- | ----------------------------------------------------- |
| Node.js 18+            | Recommended for local development                     |
| npm                    | Package manager used in this repo                     |
| Public directory sheet | Must expose a readable CSV                            |
| Public metadata sheet  | Must expose a readable CSV                            |
| Google service account | Needs write access to the main sheet                  |
| Upstash Redis database | Required for the registration queue and duplicate set |

### Setup

1. Install dependencies

```bash
npm install
```

2. Create your local environment file

```bash
cp .env.example .env.local
```

3. Fill in the environment values

4. Start the app

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### Helpful local checks

| Check                                                    | Why                                                     |
| -------------------------------------------------------- | ------------------------------------------------------- |
| Verify the public sheet CSV URLs in the browser          | Confirms the client can read the directory and metadata |
| Confirm the service account has access to the main sheet | Required for batch appends                              |
| Confirm Upstash env vars are valid                       | Required for duplicate prevention and queueing          |

---

## Deployment Notes

### Expected behavior in production

| Concern                   | Current strategy                          |
| ------------------------- | ----------------------------------------- |
| Read spikes               | Circuit breaker + jsDelivr fallback       |
| Write spikes              | Redis queue + lazy batching               |
| Duplicate registrations   | Atomic `SADD` into `pogo_registered_igns` |
| Concurrent flush attempts | `sync_lock` with TTL                      |
| Mid-flush failure         | Requeue the batch onto the main queue     |

### Operational assumptions

- `pogo_registered_igns` is expected to be populated and maintained outside the request path
- the public directory sheet is the canonical public dataset
- Redis is the operational buffer that keeps writes fast and safe

---

## Repository Automation

The repository includes `.github/workflows/sync-directory.yml`.

### What it does

| Trigger         | Behavior                                  |
| --------------- | ----------------------------------------- |
| Every 2 hours   | Downloads the latest public directory CSV |
| Manual dispatch | Lets you test the sync from the GitHub UI |

### Output

| File                                 | Purpose                                                        |
| ------------------------------------ | -------------------------------------------------------------- |
| `public/data/fallback-directory.csv` | jsDelivr-served fallback snapshot used by the client read path |

This snapshot powers the CDN fallback if Google Sheets becomes slow or temporarily unavailable.

---

## Moderation Flow

Each player card exposes `Correct` and `Report`.

| Action    | When to use it                                                  |
| --------- | --------------------------------------------------------------- |
| `Correct` | A typo or honest mistake needs to be fixed                      |
| `Report`  | The entry is invalid, misleading, or points somewhere unrelated |

### How it works

- the action opens a full-screen dialog
- the user fills in a structured form
- the app generates a polished email draft through `mailto:`
- the draft reminds the user to manually attach image or video evidence

> [!NOTE]
> Browsers cannot reliably pass selected files as real attachments into Gmail or Outlook. The current flow intentionally drafts the message and asks the user to attach evidence manually.

---

## Tech Stack

| Layer                    | Technology          |
| ------------------------ | ------------------- |
| Framework                | Next.js App Router  |
| UI                       | React, Tailwind CSS |
| Language                 | TypeScript          |
| State                    | Zustand             |
| Local storage            | idb-keyval          |
| CSV parsing              | Papa Parse          |
| Background compute       | Web Worker          |
| Queue / duplicate guard  | Upstash Redis       |
| External write API       | googleapis          |
| Fallback sync automation | GitHub Actions      |

---

## Project Positioning

PoGo-Bonfire is a good example of a portfolio project that emphasizes:

- pragmatic system design under cost constraints
- client-heavy performance optimization
- graceful degradation with multiple fallback layers
- real-world race-condition prevention in a serverless environment
- thoughtful UX for both casual users and maintainers

If you are reviewing this project as an engineer, the most interesting parts are:

- the split read/write architecture
- Redis-backed duplicate prevention and batching
- worker-offloaded search computation
- metadata-driven contact modeling without redeploying the app
