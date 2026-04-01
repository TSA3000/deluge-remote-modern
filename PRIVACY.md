# Privacy Policy — Deluge Remote Modern

**Last updated:** April 1, 2026

## Overview

Deluge Remote Modern is a browser extension that allows users to monitor and manage torrents on their own Deluge server. This extension is open source and available at [github.com/TSA3000/deluge-remote-modern](https://github.com/TSA3000/deluge-remote-modern).

## Data Collection

This extension does **not** collect, transmit, or share any personal data with the developer or any third party.

## Data Stored Locally

The following information is stored locally on your device using Chrome's `chrome.storage.sync` API:

- **Deluge server address** (protocol, IP, port, base path) — entered by you to connect to your server
- **Deluge password** — entered by you to authenticate with your server
- **User preferences** — theme setting (dark/light/system), link handling options, badge timeout, debug mode

This data is stored solely to provide the extension's functionality and is never transmitted anywhere other than to your own configured Deluge server.

## Authentication

The extension stores your Deluge Web UI password using **AES-256-GCM encryption**. The encryption key is generated per-installation and stored locally on your device (never synced). The encrypted password may sync via Chrome's storage, but cannot be decrypted without the local key. The decrypted password is only sent to the server address you configure and is never sent to any other destination.

## Network Requests

The extension only makes network requests to the Deluge Web UI server address that you configure in the options. No data is sent to any other server, analytics service, or third party.

## Third-Party Services

This extension does not use any analytics, tracking, advertising, or third-party services.

## Open Source

This extension is open source. You can review the complete source code at:
[github.com/TSA3000/deluge-remote-modern](https://github.com/TSA3000/deluge-remote-modern)

## Changes

If this privacy policy is updated, the changes will be reflected in this document with an updated date.

## Contact

If you have questions about this privacy policy, please open an issue on the [GitHub repository](https://github.com/TSA3000/deluge-remote-modern/issues).
