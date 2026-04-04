# TaskFlow — Jira-like Project Management App

A full-featured project management application built with Vue 3, Firebase, and Tailwind CSS.

## ✨ Features

- **Authentication** — Firebase Auth (Email/Password), role-based (admin / user)
- **Admin Panel** — Create, manage, and deactivate team members
- **Task Board** — Kanban board + list view with real-time updates
- **Task Timer** — Global single-timer enforcement, live HH:MM:SS display
- **Notifications** — In-app bell + email via Firebase Extension
- **Filters** — By assignee, status, priority, search
- **Task Detail** — Inline editing, timer controls, full metadata

## 🛠 Tech Stack

- Vue 3 (Composition API, `<script setup>`)
- Vue Router 4 (with auth guards)
- Pinia (state management)
- Firebase v10 (Auth + Firestore)
- Tailwind CSS 3
- Vite 5
- Lucide Vue icons
- date-fns
- @vueuse/core

---

## 🚀 Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase

Copy the environment template and fill in your Firebase project values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 3. Firebase Console Setup

#### a) Authentication
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable **Email/Password**

#### b) Firestore
1. Go to Firestore Database → Create database
2. Start in **production mode**
3. Deploy security rules: `firebase deploy --only firestore:rules`
4. Deploy indexes: `firebase deploy --only firestore:indexes`

#### c) Create First Admin User
Since there's no self-registration, create the first admin manually:

1. Firebase Console → Authentication → Add user
   - Email: `admin@yourcompany.com`
   - Password: (set a strong password)
   - Copy the UID

2. Firebase Console → Firestore → Create document:
   - Collection: `users`
   - Document ID: (paste the UID from step 1)
   - Fields:
     ```
     name: "Admin User"        (string)
     email: "admin@..."        (string)
     role: "admin"             (string)
     active: true              (boolean)
     createdAt: (server timestamp)
     ```

#### d) (Optional) Email Notifications
1. In Firebase Console → Extensions
2. Install **"Trigger Email from Firestore"**
3. Configure it to watch the `mail` collection
4. Set your SMTP credentials (e.g. SendGrid, Mailgun)

### 4. Run the app

```bash
npm run dev
```

---

## 📁 Project Structure

```
src/
├── assets/
│   └── main.css              # Tailwind + component classes
├── components/
│   ├── AppLayout.vue         # Sidebar + navbar + notifications
│   ├── TaskCard.vue          # Task card with timer controls
│   └── CreateTaskModal.vue   # New task modal form
├── firebase/
│   ├── config.js             # Firebase initialization
│   ├── auth.js               # Auth functions
│   └── firestore.js          # All Firestore operations
├── router/
│   └── index.js              # Routes + guards
├── stores/
│   ├── auth.js               # Auth Pinia store
│   ├── tasks.js              # Tasks + timer Pinia store
│   └── notifications.js      # Notifications Pinia store
├── utils/
│   └── helpers.js            # Formatters, color maps
└── views/
    ├── LoginView.vue          # User login page
    ├── AdminLoginView.vue     # Admin login page
    ├── AdminDashboardView.vue # User management
    ├── DashboardView.vue      # Main task board
    └── TaskDetailView.vue     # Task detail + inline edit
```

---

## 🗄 Firestore Structure

```
/users/{uid}
  name, email, role, createdAt, active

/tasks/{taskId}
  title, description, assignedTo, assignedToName,
  assignedBy, assignedByName, priority, status,
  dueDate, createdAt, updatedAt, lastUpdatedBy,
  timerStatus, totalElapsed, lastStarted

/notifications/{id}
  userId, taskId, taskTitle, message, read, createdAt

/mail/{id}
  to, message: { subject, html }   ← triggers email extension

/activeTimer/current
  taskId, startedAt
```

---

## 🔐 Routes

| Path | Access | Description |
|---|---|---|
| `/login` | Guest | User login |
| `/admin` | Guest | Admin login |
| `/admin/dashboard` | Admin only | User management |
| `/dashboard` | Auth | Task board |
| `/task/:id` | Auth | Task detail |

---

## 🎨 Design Notes

- **Priority colors**: Low → Green, Medium → Amber, High → Orange, Urgent → Red
- **Status colors**: To Do → Gray, In Progress → Blue, In Review → Purple, Done → Green
- **Running timer** pulses with `ring-2 ring-brand-400/40` animation
- **Timer display**: `HH:MM:SS` in monospace font, updates every second via `setInterval`
- **Global timer enforcement**: Starting a new timer auto-pauses the running one via Firestore batch write

---

## 📧 Email Notification Format

When a task is assigned, writes to `/mail` collection:
```json
{
  "to": "assignee@company.com",
  "message": {
    "subject": "[TaskFlow] New task assigned: <title>",
    "html": "...styled HTML email with task details and link..."
  }
}
```
