# University NCP - Setup Guide

## Overview

The University Notification and Communication Portal (NCP) is a centralized web platform built with React, Firebase, and Tailwind CSS. This guide will help you set up and configure the project.

---

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase account
- Git

---

## Firebase Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" and follow the setup wizard
3. Enable Google Analytics (optional)

### 2. Enable Firebase Services

#### Authentication
1. Go to **Build > Authentication** in Firebase Console
2. Click "Get Started"
3. Enable **Email/Password** authentication
4. Disable email verification (it's already disabled by default)

#### Firestore Database
1. Go to **Build > Firestore Database**
2. Click "Create Database"
3. Start in **Production mode** (we'll add security rules later)
4. Choose your preferred location

#### Storage
1. Go to **Build > Storage**
2. Click "Get Started"
3. Start in **Production mode**
4. Use default storage location

### 3. Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the **Web** icon (`</>`)
4. Register your app with a nickname (e.g., "University NCP")
5. Copy the `firebaseConfig` object

---

## Environment Configuration

1. Open `.env` file in the project root
2. Replace the Firebase placeholders with your actual values:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# AI API Configuration (Optional)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

---

## Firestore Security Rules

Go to **Firestore Database > Rules** and paste the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isApproved() {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == "approved";
    }

    function isAdmin() {
      return isApproved() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ["super_admin", "dept_admin"];
    }

    function isSuperAdmin() {
      return isApproved() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "super_admin";
    }

    function isFaculty() {
      return isApproved() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "faculty";
    }

    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isAuthenticated() &&
        (request.auth.uid == userId || isAdmin());
    }

    match /notifications/{notificationId} {
      allow read: if isApproved();
      allow create, update, delete: if isAdmin() || isFaculty();
    }

    match /resources/{resourceId} {
      allow read: if isApproved();
      allow create: if isFaculty();
      allow update, delete: if isFaculty() &&
        resource.data.uploadedBy == request.auth.uid;
    }

    match /feedback/{feedbackId} {
      allow read: if isApproved();
      allow create: if isApproved();
      allow update: if isAdmin() ||
        (isAuthenticated() && resource.data.userId == request.auth.uid);
    }

    match /activity_logs/{logId} {
      allow read: if isAuthenticated() &&
        (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated();
    }

    match /chatbot_conversations/{conversationId} {
      allow read, write: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## Firebase Storage Rules

Go to **Storage > Rules** and paste:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /id_cards/{userId}/{fileName} {
      allow read: if request.auth != null &&
        (request.auth.uid == userId ||
         firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role in ["super_admin", "dept_admin"]);
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /profile_pictures/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /resources/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role in ["faculty", "super_admin", "dept_admin"];
    }

    match /feedback_attachments/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    match /notification_attachments/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role in ["faculty", "super_admin", "dept_admin"];
    }
  }
}
```

---

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd university-ncp
```

2. Install dependencies:
```bash
npm install --include=dev
```

3. Configure environment variables (see above)

4. Start development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

---

## Creating the First Admin User

Since the first user needs to be an admin to approve others, you'll need to manually create one:

### Option 1: Firebase Console (Recommended)

1. Register a user through the app normally
2. Go to **Firebase Console > Firestore Database**
3. Find the user document in the `users` collection
4. Edit the document and change:
   - `status`: "pending" → "approved"
   - `role`: "student" → "super_admin"

### Option 2: Firebase Admin SDK (Advanced)

Create a Node.js script to create the admin user programmatically.

---

## User Roles

- **student**: Can view notifications, download resources, submit feedback
- **faculty**: Can upload resources, post assignments, all student permissions
- **dept_admin**: Can verify students of their department, post announcements, all faculty permissions
- **super_admin**: Can manage all departments, full access

---

## Project Structure

```
src/
├── components/
│   ├── auth/          # Login, Register, ProtectedRoute
│   ├── admin/         # Verification Dashboard, UserCard
│   ├── layout/        # Navbar, Sidebar, Layout, ProfileDropdown
│   ├── chatbot/       # AI Chatbot components
│   └── common/        # Reusable UI components
├── pages/             # Page components
├── context/           # React Context (Auth, Theme)
├── config/            # Firebase configuration
├── types/             # TypeScript interfaces
├── utils/             # Utilities and constants
└── services/          # API services (planned for future)
```

---

## Features Implemented

### Core Features
- User Registration with ID Card Upload
- Admin Verification Workflow
- Role-Based Access Control (RBAC)
- Email/Password Authentication
- Profile Management

### UI/UX
- Responsive Design (Mobile & Desktop)
- Dark/Light Mode Toggle
- Profile Dropdown with Quick Actions
- Smooth Animations (Framer Motion)
- Modern UI with Tailwind CSS

### Components
- Authentication Flow (Login, Register, Pending Approval)
- Admin Verification Dashboard
- Dashboard with Quick Actions
- Navigation Layout with Sidebar
- AI Chatbot Widget (Academic Only)

### Planned Features
- Notifications System
- Educational Content Repository
- Feedback & Query System
- Activity Tracking
- Real-time Updates

---

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run typecheck

# Lint code
npm run lint
```

---

## Troubleshooting

### Build fails with "vite not found"
```bash
npm install --include=dev
```

### Firebase not initialized
Make sure all environment variables in `.env` are correctly set.

### User stuck in "pending" status
Check Firestore rules and ensure an admin user exists to approve registrations.

### Dark mode not working
Clear browser cache and check that the theme toggle is clicking correctly.

---

## AI Chatbot Configuration

The chatbot currently uses rule-based responses. To integrate with Gemini or OpenAI:

1. Add your API key to `.env`
2. Modify `src/components/chatbot/ChatWindow.tsx`
3. Replace the `generateResponse` function with actual API calls

Example for Gemini:
```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: query }] }]
    })
  }
);
```

---

## Support

For issues or questions:
1. Check `FIRESTORE_DATA_MODEL.md` for database structure
2. Check `FOLDER_STRUCTURE.md` for component organization
3. Review Firebase Console for errors
4. Check browser console for client-side errors

---

## Security Best Practices

1. Never commit `.env` file to version control
2. Use Firebase Security Rules for all collections
3. Validate all user inputs
4. Keep Firebase SDK updated
5. Use HTTPS in production
6. Implement rate limiting for API calls
7. Regular security audits

---

## License

This project is for educational purposes as part of a university project.
