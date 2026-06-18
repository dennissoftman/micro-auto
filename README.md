# µAuto

µAuto is an offline-first maintenance tracker for small auto shops, solo mechanics, and personal fleets. It keeps car details, service history, payments, photos, and client records in the browser using IndexedDB, so the app stays useful without a backend.

## Features

- First-run setup for language, theme, client tracking mode, and optional database import.
- English, Russian, and Ukrainian interface translations.
- Light, dark, and system theme modes.
- Client-aware mode for tracking customers, phone numbers, balances, and their cars.
- Cars-only mode for workflows that do not need visible client tracking.
- Car records with plate, VIN, make, model, year, drivetrain, transmission, fuel, engine, notes, and advanced details.
- VIN decoding through the public NHTSA API.
- Maintenance timeline with repairs, oil changes, inspections, filters, brakes, and custom records.
- Replaced items, quantities, item prices, currencies, paid/unpaid markers, and payment status.
- Quick-pay workflow for unpaid or partially paid jobs.
- Photo attachments for cars and maintenance records.
- Dashboard grid/list views, sorting, search, and unpaid indicators.
- Configurable license plate format validation.
- ZIP backup export and restore, including image attachments.
- Legacy JSON import support.
- PWA-style service worker registration for production builds.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Dexie / IndexedDB
- Zod
- JSZip
- Lucide icons

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev      # Start local development server
npm run build    # Create production build
npm run start    # Start production server
npm run lint     # Run ESLint
npm run deploy   # Build and deploy the static output with Wrangler Pages
```

## Data And Privacy

µAuto stores operational data locally in the browser through IndexedDB. Backups are generated as downloadable ZIP files and can be restored later from the sidebar or onboarding screen.

The app does not require an application backend for local use. Cloud sync UI exists as a placeholder/mock flow and should be connected to a real backend before production sync use.

## Import Format

The app supports its native ZIP backup format and a legacy JSON format. See [`src/lib/import-spec.md`](src/lib/import-spec.md) for the JSON structure.

## Deployment

The project is configured for static output and includes a Cloudflare Pages deploy script:

```bash
npm run deploy
```

Set up Wrangler authentication before deploying.

## Roadmap

- Cloud sync for keeping local shop data available across devices.
- Useful AI features, including car state reports based on maintenance history and repair or maintenance suggestions.
- A mobile-adapted version with workflows optimized for phones and tablets.

## License

MIT. See [`LICENSE`](LICENSE).
