# Deluge Remote Modern — TODO

Active backlog of features and improvements for the Chrome extension.

---

## 🚀 Next Release (v2.9.0)

### Quick UI Controls in Popup

**1. Torrents per page selector directly on popup**
- Add dropdown (10 / 20 / 50 / 100 / All) in the popup toolbar next to pagination
- Persist selection via `chrome.storage.sync` → `torrents_per_page`
- Currently only configurable in Options — move to popup for quick switching
- **Files**: `popup.html` (add `<select id="per_page_popup">`), `popup.js` (change handler + sync back to storage), `css/popup.css` (styling)
- **Est**: 30 min

**2. Prowlarr result pagination + per-page selector**
- Apply the same paginated pattern from the Torrents tab to Prowlarr search results
- Add "Results per page" dropdown (10 / 20 / 50 / 100 / All) on the Prowlarr tab
- Prev / Next buttons + page info (`Page 1 / 5`)
- Reset to page 1 on new search or sort change
- **Files**: `popup.html` (pagination bar inside `#tab-search`), `js/prowlarr_search.js` (slice `currentResults` by page, `updateResultsPagination()`), `css/prowlarr.css` (styling — reuse pagination pattern)
- **Est**: 1.5 hours
- **Storage key**: `prowlarr_results_per_page` (default 20)

**3. Prowlarr result filter (client-side)**
- Add a small filter input above the results table
- Real-time filter by release title (150ms debounce, Esc to clear)
- Filters the already-fetched `currentResults` array — no new API call
- Same UX as the torrent search filter
- **Files**: `popup.html` (add `<input id="prowlarr_results_filter">`), `js/prowlarr_search.js` (filter function), `css/prowlarr.css`
- **Est**: 45 min

**4. Prowlarr history pagination + per-page selector**
- Same treatment for History tab — paginate with per-page dropdown
- Filter box for searching across history entries (by query text)
- **Files**: `popup.html` (pagination bar inside `#tab-history`), `js/prowlarr_search.js` (`renderHistory` pages through `_historyCache`), `css/prowlarr.css`
- **Est**: 1 hour
- **Storage key**: `prowlarr_history_per_page` (default 20)

**5. Persist last Prowlarr search across popup close/reopen**
- Currently `currentResults` lives in memory only — closing the popup wipes the last search, forcing a re-run
- Store the last search state in `chrome.storage.session` so re-opening the popup shows the same results until the user runs a new search
- State to persist: `query`, `category`, `indexerIds`, `results` array, `ts` timestamp, `sortColumn`, `sortDesc`
- Storage key: `prowlarr_last_search`
- On popup open, restore state into `currentResults`, repopulate the query input + filters, call `renderResults()`
- On new search, overwrite the stored state; on "Clear results" button, remove the key
- `chrome.storage.session` auto-clears on browser restart so stale data doesn't accumulate
- Show a subtle indicator (e.g. "Last search: 'ubuntu' · 3 min ago") above the results when restoring cached results
- **Files**: `js/prowlarr_search.js` (`saveLastSearch()`, `restoreLastSearch()` on `pub.init`), possibly `popup.html` (tiny "restored" label)
- **Est**: 1 hour

**6. Remember selected indexers across popup close/reopen**
- Currently the indexer multi-select resets to "All indexers" each time the popup opens — annoying if user always searches specific indexers (e.g. only private trackers)
- Persist `selectedIndexers` array in `chrome.storage.sync` so the preference syncs across devices
- Storage key: `prowlarr_selected_indexers` (default `[]` = all)
- On indexer menu change, write the selection immediately
- On `loadIndexers()` success, restore saved selection into `selectedIndexers` before `renderIndexerList()` paints the checkboxes
- Validate restored IDs against the fresh indexer list — drop IDs that no longer exist (indexer removed in Prowlarr)
- If all saved IDs are invalid, fall back to "All indexers"
- **Files**: `js/prowlarr_search.js` (save in indexer change handler, restore in `loadIndexers` callback), `js/global_options.js` (add default), `js/background.js` (add default)
- **Est**: 30 min
- **Note**: Complements feature #5 — together they mean "popup reopens exactly as you left it"

---

## 📋 Community Feedback Backlog

### Quick wins (~30 min each)

- **Auto-set port on protocol change** — http → 8112, https → 443 (configurable default)
- **Better label copy** — "Context menu" → "Send to Deluge right-click menu"
- **Badge timeout** → "Action notification duration"
- **Debug mode tooltip** — Explain what it does
- **Additional sort options** — Add Label, Tracker, State, Error to sort dropdown

### Medium features

- **Right-click context menu on torrent rows** — Quick actions without opening the row
- **In-popup debug pane** — Live API request/response view for troubleshooting
- **Free space indicator** — Show Deluge disk free space in popup footer (`core.get_free_space`)
- **Global pause/resume session** — One button to pause/resume everything (`core.pause_session` / `core.resume_session`)
- **Force reannounce button** — Per-torrent (`core.force_reannounce`)
- **Queue top/bottom buttons** — Not just up/down one step (`core.queue_top` / `core.queue_bottom`)
- **Move storage** — Right-click → Move Storage dialog (`core.move_storage`)

### Big features

- **File browser dialog** — Browse torrent files, select which to download
- **Virtual scrolling** — Biggest perf win for 8k+ torrent libraries. Replace pagination with windowed rendering so only visible rows are in DOM.

---

## 🐛 Known Issues

- None currently tracked — v2.8.0 is stable

---

## ✅ Recently Completed

- **v2.8.0** — Prowlarr integration, optimistic delete, auto-reconnect
- **v2.7.0** — Auto-reconnect to daemon
- **v2.6.0** — Search, diff polling, events, setup polish, plugin detection
- **v2.5.0** — Pagination
- **v2.4.0** — Test Connection button

---

## 💡 Ideas (unprioritized)

- Keyboard shortcuts (`/` to focus search, `j`/`k` to navigate rows, etc.)
- Bulk actions (multi-select torrents via shift-click, apply action to all)
- Torrent grouping by label/tracker (collapsible sections)
- Progress notifications for completed torrents (browser notifications API)
- Stats tab — Aggregate session stats, graphs via Chart.js
- Import/export extension settings as JSON
- Theme editor (custom accent colors)
- Multi-language support (already have `_locales/en/messages.json` — add more)