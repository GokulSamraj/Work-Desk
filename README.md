# TaskFlow — Team Task Management

A full-featured project management app built with **Nuxt 3**, Firebase, and Tailwind CSS.

> **Light Theme UI** — Features a beautiful, clean, modern light theme with carefully chosen grays, encrypted task data, and automatic Google provisioning.

---

## ✨ Features

- **Authentication** — Firebase Auth with **Google Sign-In only**. First time logging in as `gokul_s@lmes.in` will automatically grant super-admin status.
- **Data Encryption** — Client-side AES encryption for Task titles, descriptions, Notifications, and Mail elements.
- **Admin Panel** — Create, manage, activate/deactivate, and delete team members + graphical role analysis with `vue-chartjs`.
- **Task Board** — Kanban board + list view with real-time Firestore updates and intelligent Date filtering.
- **Task Timer** — Global single-timer enforcement, instantly stored in DB upon pause.
- **Notifications** — In-app bell with unread badge + email via Firebase Extension.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 3 (SPA mode, SSR disabled) |
| Language | Vue 3 Composition API (`<script setup>`) |
| Encryption | crypto-js |
| Database | Firebase v10 (Firestore) |
| Layout / Visuals | Tailwind CSS 3, Chart.js, vue-chartjs |

---

## 🚀 Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase & Secrets

Copy the environment template and fill in your Firebase project values:

```bash
cp .env.example .env.local
```

Edit `.env.local` to include Firebase config AND your encryption key:
```env
VITE_ENCRYPTION_KEY=your_secret_encryption_key
VITE_FIREBASE_API_KEY=AIza...
...
```

### 3. Firebase Console Setup

- **Authentication**: Enable Google OAuth.
- **Firestore**: Deploy a production-ready Firestore database.

### 4. Admin Setup (Automatic)

- Click `Continue with Google` and login with `gokul_s@lmes.in`.
- Your admin account is automatically configured! You can navigate to the Admin Dashboard and start inviting users.

### 5. Run the app

```bash
npm run dev
```

App will be available at **http://localhost:3000**.

---

## 🔐 Routes & Access Control

| Path | Access | Description |
|---|---|---|
| `/` | Any | Instant redirect → `/login` |
| `/login` | Guest only | User sign-in (redirects away if logged in) |
| `/dashboard` | **Auth required** | Task board with "Current day + Previously pending" filters |
| `/admin/dashboard` | **Admin only** | User management panel + Analysis Graph |

---

## ⚠️ Known Behaviour

| Message | Cause | Action |
|---|---|---|
| `ERR_BLOCKED_BY_CLIENT` on Firestore URLs | **Ad blocker** blocking Firebase WebSocket connections | Disable ad blockers |
| `Cross-Origin-Opener-Policy would block window.closed` | Browser COOP policy vs Google popup | Safe to ignore, handled correctly. |
