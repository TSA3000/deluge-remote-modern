# Deluge Remote Modern

[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/okjmppgdfmooahhabhcdjdhnmnkgkila?label=Chrome%20Web%20Store)](https://chromewebstore.google.com/detail/okjmppgdfmooahhabhcdjdhnmnkgkila)
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/okjmppgdfmooahhabhcdjdhnmnkgkila?label=users)](https://chromewebstore.google.com/detail/okjmppgdfmooahhabhcdjdhnmnkgkila)
[![Chrome Web Store Rating](https://img.shields.io/chrome-web-store/rating/okjmppgdfmooahhabhcdjdhnmnkgkila?label=rating)](https://chromewebstore.google.com/detail/okjmppgdfmooahhabhcdjdhnmnkgkila)
[![GitHub release](https://img.shields.io/github/v/release/TSA3000/deluge-remote-modern?label=release)](https://github.com/TSA3000/deluge-remote-modern/releases)
[![License](https://img.shields.io/github/license/TSA3000/deluge-remote-modern)](./MIT-LICENSE)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-support-FFDD00?style=flat-square&logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/tsa3000)

---

A Chrome extension for managing a remote Deluge torrent server from your browser toolbar. Fork of [YodaDaCoda/chrome-deluge-remote](https://github.com/YodaDaCoda/chrome-deluge-remote) modernized for Manifest V3 with dark mode, themes, and more.

**Chrome Web Store:** `okjmppgdfmooahhabhcdjdhnmnkgkila`
**Repo:** <https://github.com/TSA3000/deluge-remote-modern>

## Features

- **Full Deluge control** — Pause/resume, queue up/down, recheck, delete (with or without data), toggle auto-managed, set labels
- **Add torrents** — From the popup (URL/magnet), right-click links, or `.torrent` file downloads
- **Prowlarr integration** — Search private and public indexers directly from the popup, grab releases to your download client, search history
- **Search by name** — Real-time filter box (150ms debounce, Esc to clear)
- **Filters** — State, Tracker, Label
- **Pagination** — Configurable torrents per page (10, 20, 50, 100, or all)
- **Dark Mode & Themes** — Light, Dark (Midnight), Solarized Dark, Nord, Dracula, or System (auto)
- **Icon Packs** — Classic (original PNG) or Modern (SVG glyphs)
- **Test Connection** — Verify setup before saving
- **Auto-reconnect** — Automatically reconnects to daemon after restarts
- **Variable Refresh Rate** — Configure how often the popup polls your server (500ms – 30s)
- **Password encryption at rest** — Uses Web Crypto API (AES-GCM) with a per-install key

## Performance

- **Diff-based polling** — Only changed fields returned on each poll (`core.get_torrents_status` with `diff=true`) — 80-95% less data for large libraries
- **Event-driven updates** — Subscribes to Deluge events for near-instant add/remove
- **Optimistic delete** — Torrents disappear instantly on delete, reconciled on next full update
- **Trimmed payload** — Only requests fields the UI actually uses

## Version History

### 2026-04-18 v2.8.0 — Prowlarr Integration & Optimistic Delete
- Full Prowlarr search from the popup — tabbed UI (Torrents / Search Indexers / History)
- Indexer multi-select, sortable results, one-click grab
- Search history (last 50 queries persisted)
- Encrypted Prowlarr API key (same AES-GCM as Deluge password)
- Optimistic torrent deletion — instant row removal with server reconciliation

### 2026-04-17 v2.7.0 — Auto-Reconnect to Daemon
- Automatic daemon reconnection when WebUI loses connection
- "Reconnecting to daemon..." overlay during attempts

### 2026-04-16 v2.6.1 — Pagination Dark Mode Fix
- Fixed pagination bar appearing light in dark themes (including System/OS dark mode)

### 2026-04-16 v2.6.0 — Performance, Search, Setup Polish
- Search by name, diff polling, events, trimmed fields
- Live URL preview, password toggle, HTTP warning, better Test Connection feedback
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

### Deluge

1. Click the extension icon, then the options gear, or right-click the icon → Options
2. Fill in your Deluge protocol (http/https), IP/hostname, port (default 8112), and password
3. Leave the "Base path" field empty unless you use a reverse proxy (e.g. `https://yourdomain.com/deluge/`)
4. Click **Test Connection** to verify — you should see "✓ Connected successfully!"
5. Save

### Prowlarr (optional)

1. In Options, check **Enable Prowlarr** under Extras
2. Fill in your Prowlarr protocol, IP/hostname, port (default 9696), and API key
3. The API key can be found in Prowlarr → Settings → General → Security
4. Save — the popup will now show Torrents / Search Indexers / History tabs

### Firefox HTTPS-Only Mode

If you use HTTP (not HTTPS) to connect, Firefox's HTTPS-Only Mode will block the request. Add an exception in `about:preferences#privacy` → HTTPS-Only Mode → Manage Exceptions → add your Deluge host.

## Privacy

See [`PRIVACY.md`](PRIVACY.md). Short version: nothing leaves your browser except API calls to your Deluge server and (if enabled) your Prowlarr server. No telemetry, no ads, no external services.

## License

MIT — see [`MIT-LICENSE`](MIT-LICENSE).

## Credits

- Original extension: [YodaDaCoda](https://github.com/YodaDaCoda/chrome-deluge-remote)
- Modernization, theming, pagination, search, performance, Prowlarr integration: Project fork maintainers
- Community feedback from the Deluge forums (ambipro and others)
- Prowlarr API patterns inspired by [cross-seed](https://github.com/cross-seed/cross-seed)
