# Remote Deluge

Provides quick overview of torrent information in Chrome for the torrent client Deluge.

## Request for help

I develop this in my spare time, which is very limited. Pull requests will be gratefully accepted where possible.

## Screenshots

### Original
![](webstore/screenshot1.png)

### Dark Mode
![](webstore/screenshot1dark.png)

### Light Mode
![](webstore/screenshot1light.png)

## Version History

2026-04-01 v2.0.0
* Migrated to Manifest V3 (service worker, fetch API, chrome.action)
* Added dark mode support (System/Light/Dark)
* Upgraded jQuery 3.0.0 → 4.0.0
* Removed unused jquery_tablesorter.js
* Default protocol changed to HTTPS
* Handle .torrent and magnet links enabled by default
* Fixed active icon (was JPEG disguised as PNG)
* New green active icon for clear connected state
* Improved error handling throughout

2017-04-10 v1.2.4
* Fix for Deluge v1.3.14

2016-06-22 v1.2.3
* Fix bug for first-time users.

2016-06-22 v1.2.2
* Fix a couple niggling bugs and added a donate button. Please donate if you find my work useful! :)

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
