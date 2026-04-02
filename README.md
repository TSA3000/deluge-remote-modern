# Deluge Remote Modern

[![GitHub release](https://img.shields.io/github/release/TSA3000/deluge-remote-modern.svg)](https://github.com/TSA3000/deluge-remote-modern/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](MIT-LICENSE)

A modern, Manifest V3 fork of [Remote Deluge](https://github.com/YodaDaCoda/chrome-deluge-remote) by [YodaDaCoda](https://github.com/YodaDaCoda).

Provides quick overview of torrent information in Chrome for the torrent client Deluge.

## What's different from the original?

This fork modernizes the original extension which hasn't been updated since 2017:

- **Manifest V3** — Required for continued Chrome support
- **Label Selector** — Change torrent labels directly from the popup
- **Password Encryption** — AES-GCM password encryption for synced storage
- **Dark Mode** — System, Light, and Dark themes
- **Vanilla JS** — jQuery removed entirely for a much lighter, faster extension (saved ~77KB)
- **HTTPS by default** — Default protocol changed to HTTPS
- **Service Worker** — Background page replaced with MV3 service worker
- **Native fetch()** — Replaced jQuery AJAX in background context

## Credits

This project is a fork of [chrome-deluge-remote](https://github.com/YodaDaCoda/chrome-deluge-remote) originally created by [YodaDaCoda](https://github.com/YodaDaCoda). The original extension is licensed under the [MIT License](MIT-LICENSE). We are grateful for their work which this project builds upon.

## Screenshots

### Dark Mode
![](webstore/screenshot1dark.png)

### Light Mode
![](webstore/screenshot1light.png)

### Original Style
![](webstore/screenshot1.png)

## Version History

2026-04-02 v2.1.0
* Completely removed jQuery dependency for a lighter footprint (saved ~77KB)
* Replaced heavy jQuery methods with a lightweight custom `dom_helper.js`
* Rewrote popup, options, torrents, and add_torrent logic in native Vanilla JS

2026-04-01 v2.0.2
* Added label selector dropdown on each torrent in the popup
* Uses Deluge's `label.set_torrent` API (requires Label plugin enabled)
* Fixed Error state progress bar color in dark mode

2026-04-01 v2.0.1
* Added AES-GCM password encryption for `chrome.storage.sync`
* Added dynamic local AES-256 key generation
* Added backward compatibility/auto-upgrade for plain text passwords

2026-04-01 v2.0.0
* Forked from YodaDaCoda/chrome-deluge-remote v1.2.4
* Migrated to Manifest V3 (service worker, fetch API, chrome.action)
* Added dark mode support (System/Light/Dark)
* Upgraded jQuery 3.0.0 → 4.0.0
* Removed unused jquery_tablesorter.js
* Default protocol changed to HTTPS
* Handle .torrent and magnet links enabled by default
* Fixed active icon (was JPEG disguised as PNG)
* New green active icon for clear connected state
* Improved error handling throughout

### Original Version History (by YodaDaCoda)

2017-04-10 v1.2.4
* Fix for Deluge v1.3.14

2016-06-22 v1.2.3
* Fix bug for first-time users.

2016-06-22 v1.2.2
* Fix a couple niggling bugs and added a donate button.

2016-01-27 v1.2.1
* Fixed broken settings from v1.2.0

2016-01-26 v1.2.0
* Fix context menu
* Fixed possible connections issue
* Various other code improvements

2015-06-04 v1.1.0
* Fix for connectivity problem introduced in last version

2015-06-03 v1.0.0
+ Add an option to settings for a base path for reverse-proxied connections.

## License

MIT License — See [MIT-LICENSE](MIT-LICENSE) for details.