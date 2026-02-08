# replit.md

## Overview

This is **N-Corp**, a web-based panel/dashboard application built with Express.js (v5) and Handlebars templating. The project appears to be a product management and authentication system that manages multiple product lines (Rage, Basic, Streamer, and Android variants). It includes session management, WebSocket support, and a sidebar-based UI styled with Tailwind CSS. The MongoDB integration is currently mocked, and Redis is configured for session storage (though currently commented out).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Backend (Node.js + Express 5)

- **Framework**: Express v5 with several middleware layers
  - `express-session` for session management with cookie-based sessions (7-day expiry)
  - `express-ws` for WebSocket support
  - `express-handlebars` for server-side templating (`.hbs` files)
  - `ajv` for JSON schema validation on API inputs
- **Entry point**: `N-Corp/main.js` — sets up the Express app, view engine, session store, and API router
- **Routing**: Uses `express.Router` with case-sensitive routing for the API layer
- **Trust proxy**: Enabled (`app.set('trust proxy', true)`) indicating the app is designed to run behind a reverse proxy

### Frontend

- **Templating**: Handlebars (`.hbs` files) with a default layout at `N-Corp/public/main.hbs`
- **Styling**: Tailwind CSS v4, loaded via browser-based `@tailwindcss/browser` (no build step)
- **JavaScript**: jQuery v3.7.1 for DOM manipulation, with custom UI code in `N-Corp/public/main.js` handling sidebar toggle and tab navigation
- **Static assets**: Served from `N-Corp/public/`

### Data Storage

- **MongoDB**: Listed as a dependency. Currently using a mock implementation (`N-Corp/mongodb.js`) that simulates `collection.findOne`, `updateOne`, and `insertOne` operations. The mock includes hardcoded admin credentials for development
- **Redis**: Configured for session storage via `connect-redis`, but currently commented out. Connection was pointed to `db.igrp.app:1080`. When re-enabled, sessions will be stored with prefix `n-corp:session`

### Authentication

- Session-based authentication using `express-session`
- Mock auth currently accepts `admin/admin` credentials with role-based access
- Key-based and HWID-based validation fields exist in the user schema (fields: `user`, `pass`, `role`, `key`, `hwid`, `validTill`)
- Sessions persist for 7 days via cookie `maxAge`

### Logging

- Simple logging utility (`N-Corp/log.js`) with `Print(type, msg)`, `Log(msg)`, and `Error(msg)` functions that output to console with bracketed prefixes

### Project Structure

```
/                       # Root workspace (outer package.json with shared deps)
├── package.json        # Workspace-level dependencies (express, handlebars, etc.)
├── N-Corp/             # Main application directory
│   ├── main.js         # Express app setup and configuration
│   ├── mongodb.js      # Database abstraction (currently mocked)
│   ├── log.js          # Logging utility
│   ├── package.json    # App-specific deps (axios, discord.js, mongodb, etc.)
│   └── public/         # Frontend assets and Handlebars templates
│       ├── main.js     # Client-side UI logic (jQuery)
│       ├── jquery.js   # jQuery library
│       └── tailwindcss.js  # Tailwind CSS browser runtime
```

### Key Design Decisions

- **Peer dependencies pattern**: Express and related middleware are peer dependencies of the N-Corp package, installed at the workspace root. This separates the web framework from the application logic
- **Mock database**: MongoDB is abstracted behind a simple interface returning mock data, making it easy to swap in a real MongoDB connection later
- **Browser-based Tailwind**: No CSS build step required; Tailwind processes styles at runtime in the browser. This simplifies development but isn't optimal for production
- **Environment variables**: Uses `dotenv` with `override: true` for configuration

## External Dependencies

### Core Services
- **MongoDB** (`mongodb` v7): Primary database (currently mocked). Expected to store user accounts, product keys, and HWID data
- **Redis** (`redis` v5 + `ioredis` v5): Session storage backend. Configured for `db.igrp.app:1080` but currently disabled
- **Discord.js** (v14): Discord bot integration, likely for notifications or command-based management

### Key NPM Packages
- **express** v5.2.1 — Web framework
- **express-handlebars** v8 — Template engine
- **express-session** v1.19 — Session middleware
- **express-ws** v5 — WebSocket support
- **connect-redis** v7/v9 — Redis session store
- **ajv** v8 — JSON schema validation
- **axios** v1.13 — HTTP client
- **adm-zip** v0.5 — ZIP file handling
- **node-cron** v4 — Scheduled tasks
- **mime-types** v3 — MIME type detection
- **dotenv** v17 — Environment variable loading
- **@dev-swarup/http-mitm-proxy** v0.9.6 — HTTP proxy (MITM capability)
- **https-proxy-agent** v7 — HTTPS proxy support