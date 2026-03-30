# PoGo-Bonfire

PoGo-Bonfire is a high-performance, progressive web application (PWA) designed to act as a global directory for Pokémon GO players. It solves the friction of finding in-game friends across the world for remote raids, daily gifts, and lucky trades.

This project is built on a highly optimized "Serverless Gateway" architecture, utilizing Google Sheets as a headless CMS and database to achieve infinite scalability with exactly $0.00 in monthly operational costs.

## Architecture Philosophy

The core engineering constraint of this project was to handle tens of thousands of potential concurrent users without incurring hosting or database egress fees.

To achieve this, PoGo-Bonfire decouples the read and write paths:

- **The Read Path:** Completely serverless and client-heavy. The application fetches raw CSV exports directly from public Google Sheets, parsing and indexing the data into an O(1) memory store (`zustand`) and persisting it in the browser via IndexedDB.
- **The Write Path:** A secure Vercel Edge API route acts as a gateway, validating inputs, enforcing IP rate limits, and communicating securely with the Google Sheets API via a private Service Account.

## Key Features

- **Dynamic Metadata Configuration:** Tags, supported contact platforms, and directory settings are controlled via a secondary Admin Google Sheet. This allows live updates to the app's configuration without triggering a codebase redeploy.
- **Aggressive Client-Side Caching:** Utilizes `idb-keyval` to cache the global directory (12-hour TTL) and metadata config (1-month TTL), ensuring subsequent visits load instantly with zero network payload.
- **In-Memory Search & Infinite Scroll:** Complex multi-tag filtering and sorting execute with zero latency directly against the client's RAM, paginating DOM nodes 20 at a time to maintain a smooth 60fps mobile experience.
- **Offline-First Wishlist:** Users can save In-Game Names (IGNs) locally. When the background sync pulls a fresh directory CSV, it cross-references the wishlist and surfaces matches.
- **Device-Locked Registration:** Bypasses the need for heavy OAuth by storing a local registration state, automatically locking the device to the registered IGN to prevent duplicate submissions while keeping the UI clean.
- **Portal-to-Mailto Moderation:** A custom modal flow that generates pre-formatted, structured emails to the admin team for typo corrections or bad-actor reporting, natively handling the limitations of browser attachment capabilities.

<img width="2098" height="2907" alt="Image" src="https://github.com/user-attachments/assets/56b3d309-7a64-42b0-be19-9fd3073c4b5a" />

---

## Technology Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Local Persistence:** idb-keyval (IndexedDB)
- **Data Parsing:** Papaparse
- **Serverless API:** Vercel Functions
- **Database Connection:** googleapis

## Local Development Setup

### Prerequisites

You will need Node.js (v18+) installed and a Google Cloud Service Account with Editor access to your target Google Sheets.

### 1. Clone the repository

```bash
git clone [https://github.com/yourusername/pogo-bonfire.git](https://github.com/yourusername/pogo-bonfire.git)
cd pogo-bonfire
```

### 2. Install dependencies

```Bash
npm install
```

### 3. Environment Configuration

Create a .env.local file in the root directory and add your Google Service Account credentials. These are strictly used by the Vercel API routes and are never exposed to the client.

```
GOOGLE_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nLong\nKey\nHere\n-----END PRIVATE KEY-----\n"
```

# IDs for your specific Google Sheets

```
NEXT_PUBLIC_DIRECTORY_SHEET_ID="your_directory_sheet_id_here"
NEXT_PUBLIC_METADATA_SHEET_ID="your_metadata_sheet_id_here"
Note: Ensure your GOOGLE_PRIVATE_KEY is formatted correctly with \n replacing actual line breaks.
```

### 4. Run the development server

```Bash
npm run dev
```

Navigate to http://localhost:3000 to view the application.

### Database Schema (Google Sheets)

The application relies on two distinct spreadsheets. Both must be set to "Anyone with the link can view" to allow the client-side CSV fetches to succeed.

```
=> Sheet 1: Directory (Main Player Data)

Column A: IGN (Primary Key)

Column B: Friend Code

Column C: Contact Platform (e.g., Reddit, Discord)

Column D: Contact Link

Column E: Tags (Comma-separated index numbers, e.g., "0,2,3")

Column F: Timestamp
```

```
=> Sheet 2: Metadata (Admin Configuration)

Column A: Kind (e.g., "contact" or "tag")

Column B: Key (e.g., "reddit" or "0")

Column C: Label (e.g., "Reddit" or "#SendGiftsEveryday")

Column D: Pattern (Regex for validation, used for contacts)
```

### Contributing

While this is primarily a personal project, pull requests addressing bug fixes, performance improvements to the parsing worker, or accessibility enhancements are welcome.

Please ensure any UI additions strictly utilize Tailwind utility classes to maintain the minimal CSS bundle size.

### License

This project is licensed under the MIT License.
