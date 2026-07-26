# gear.show

Show off your rig. Create a shareable, embeddable showcase of your gear — no signup, no accounts, no BS.

## How it works

1. **Create** a showcase by entering your name, bio, and gear list
2. **Get two links**: a public page and a secret edit URL
3. **Share** the public page, or **embed** it on your site via iframe
4. **Edit** anytime using your secret edit URL (keep it safe — it's your password)

## Features

- 🎸 Clean, dark-mode showcase pages with personality
- 📦 Embeddable widget (iframe) for your personal site
- 🔗 Optional affiliate/retailer links on each gear item
- ✍️ Personal notes on each piece ("my main axe since 2019")
- 🗂️ Categories: instruments, audio, software, effects, accessories, other
- 📱 Mobile-responsive
- 🔒 No auth — edit-via-secret-URL pattern (like PicoShare)
- 💾 SQLite storage — no external DB required

## Tech stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** for styling
- **better-sqlite3** for local data storage
- Docker-ready

## Getting started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Open http://localhost:3000
```

## Deployment

### Vercel

```bash
vercel
```

> Note: better-sqlite3 is a native module — you may need to use a Node.js-compatible runtime or switch to JSON file storage for Vercel serverless. For V1, Docker/VPS deployment is recommended.

### Docker

```bash
docker build -t gear-showcase .
docker run -p 3000:3000 -v $(pwd)/data:/app/data gear-showcase
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/showcases` | Create a showcase (body: `{ name, bio, gear[] }`) |
| `GET` | `/api/showcases?token=TOKEN` | Fetch showcase by edit token |
| `PUT` | `/api/showcases` | Update showcase (body: `{ token, name?, bio?, gear? }`) |
| `DELETE` | `/api/showcases?token=TOKEN` | Delete showcase |

## URL structure

- **Create**: `GET /`
- **Public page**: `GET /s/{slug}`
- **Embed**: `GET /s/{slug}/embed`
- **Edit**: `GET /edit/{token}`

## License

MIT — do whatever you want with it.