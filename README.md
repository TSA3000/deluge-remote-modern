# Deluge Remote Modern

A Chrome extension for managing a remote Deluge torrent server from your browser toolbar. Fork of [YodaDaCoda/chrome-deluge-remote](https://github.com/YodaDaCoda/chrome-deluge-remote) modernized for Manifest V3 with dark mode, themes, and more.

**Chrome Web Store:** `okjmppgdfmooahhabhcdjdhnmnkgkila`
**Repo:** <https://github.com/TSA3000/deluge-remote-modern>

## Features

- **Full Deluge control** — Pause/resume, queue up/down, recheck, delete (with or without data), toggle auto-managed, set labels
- **Add torrents** — From the popup (URL/magnet), right-click links, or `.torrent` file downloads
- **Search by name** — Real-time filter box (150ms debounce, Esc to clear)
- **Filters** — State, Tracker, Label (hidden when Label plugin disabled)
- **Pagination** — Configurable torrents per page (10, 20, 50, 100, or all)
- **Dark Mode & Themes** — Light, Dark (Midnight), Solarized Dark, Nord, Dracula, or System (auto)
- **Icon Packs** — Classic (original PNG) or Modern (SVG glyphs)
- **Test Connection** — Verify setup before saving
- **Variable Refresh Rate** — Configure how often the popup polls your server (500ms – 30s)
- **Password encryption at rest** — Uses Web Crypto API (AES-GCM) with a per-install key

## Performance

- **Diff-based polling** — Only changed fields returned on each poll (`core.get_torrents_status` with `diff=true`) — 80-95% less data for large libraries
- **Event-driven updates** — Subscribes to Deluge events for near-instant add/remove
- **Trimmed payload** — Only requests fields the UI actually uses
- **Plugin detection** — Hides UI for plugins not enabled on the server

## Version History

### 2026-04-16 v2.6.1 — Pagination Dark Mode Fix
- Fixed pagination bar appearing light in dark themes (including System/OS dark mode)

### 2026-04-16 v2.6.0 — Performance, Search, Setup Polish & Plugin Detection
- Search by name, diff polling, events, trimmed fields
- Live URL preview, password toggle, HTTP warning, better Test Connection feedback
- Label plugin detection — hides UI when plugin disabled
- AbortError bugfix, timeouts raised to 5s

### 2026-04-15 v2.5.0 — Pagination
- Paginated torrent list with configurable items per page

### 2026-04-11 v2.4.0 — Test Connection Button
- Added "Test Connection" button to Options page

For earlier versions, see `RELEASE_NOTES.md` and git history.

## Installation

### Chrome Web Store (recommended)

Install from the [Chrome Web Store listing](https://chromewebstore.google.com/detail/okjmppgdfmooahhabhcdjdhnmnkgkila).

### From source

1. Clone this repo
2. Chrome → `chrome://extensions` → Enable Developer mode → Load unpacked → select this folder
3. Open the extension's Options page and configure your Deluge address and password

## Setup

1. Click the extension icon, then the options gear, or right-click the icon → Options
2. Fill in your Deluge protocol (http/https), IP/hostname, port (default 8112), and password
3. Leave the "Base path" field empty unless you use a reverse proxy (e.g. `https://yourdomain.com/deluge/`)
4. Click **Test Connection** to verify — you should see "✓ Connected successfully!"
5. Save

### Firefox HTTPS-Only Mode

If you use HTTP (not HTTPS) to connect, Firefox's HTTPS-Only Mode will block the request. Add an exception in `about:preferences#privacy` → HTTPS-Only Mode → Manage Exceptions → add your Deluge host.

## Privacy

See [`PRIVACY.md`](PRIVACY.md). Short version: nothing leaves your browser except API calls to your Deluge server. No telemetry, no ads, no external services.

## License

MIT — see [`MIT-LICENSE`](MIT-LICENSE).

## Credits

- Original extension: [YodaDaCoda](https://github.com/YodaDaCoda/chrome-deluge-remote)
- Modernization, theming, pagination, search, performance, plugin detection: Project fork maintainers
- Community feedback from the Deluge forums (ambipro and others)
