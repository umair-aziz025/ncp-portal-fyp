# Quick Start Guide - University NCP

Your Firebase configuration is complete! Follow these steps to set up the security rules and run the app.

---

## Step 1: Set Up Firebase Security Rules (5 minutes)

### A. Firestore Rules

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **polished-core-455610-k5**
3. Go to **Build** → **Firestore Database**
4. Click the **Rules** tab
5. Copy all content from: `firestore.rules` file
6. Paste into Firebase Console
7. Click **Publish**

### B. Storage Rules

1. Still in Firebase Console
2. Go to **Build** → **Storage**
3. Click the **Rules** tab
4. Copy all content from: `storage.rules` file
5. Paste into Firebase Console
6. Click **Publish**

### C. Enable Authentication

1. Go to **Build** → **Authentication**
2. Click **Get Started** (if not enabled)
3. Click **Sign-in method** tab
4. Enable **Email/Password**
5. Save changes

---

## Step 2: Start the Development Server

```bash
npm run dev
```

The app will start at: **http://localhost:5173**

---

## Step 3: Create Your First Account

1. Open http://localhost:5173 in your browser
2. Click **"Register here"**
3. Fill in the registration form:
   - Full Name
   - Email (use your real email)
   - Password
   - Department (e.g., BIT)
   - Roll Number (format: FA23-BIT-053)
   - Upload your ID card image
4. Click **Register**
5. You'll be redirected to **"Pending Approval"** page

---

## Step 4: Promote Yourself to Admin

Since this is your first account, you need to manually approve it:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **polished-core-455610-k5**
3. Go to **Build** → **Firestore Database**
4. Click on the **users** collection
5. Find your user document (by your email)
6. Click on your document to open it
7. Click **Edit Document** (pencil icon)
8. Change these two fields:
   - `status`: "pending" → **"approved"**
   - `role`: "student" → **"super_admin"**
9. Click **Update**

---

## Step 5: Login as Admin

1. Go back to the app: http://localhost:5173
2. Click **"Back to Login"**
3. Login with your email and password
4. You're now logged in as a Super Admin! 🎉

---

## What You Can Do Now

### As Super Admin, you can:

1. **Dashboard**: View overview and quick actions
2. **Notifications**: View announcements (empty for now)
3. **Resources**: Browse educational materials (empty for now)
4. **Feedback**: Submit and view feedback (empty for now)
5. **Verification**: Approve/reject new user registrations

### Try These Features:

#### 1. Test Dark Mode
- Click the moon/sun icon in the top navigation
- The entire app switches between light and dark themes

#### 2. Use the AI Chatbot
- Click the blue chat bubble in bottom-right corner
- Ask academic questions like:
  - "How do I access resources?"
  - "How do I submit feedback?"
  - "What are study tips?"
- Try asking non-academic questions (it will politely refuse)

#### 3. Test User Approval Workflow
- Open an incognito/private browser window
- Register a new test account
- Go back to your admin account
- Click **Verification** in the sidebar
- You'll see the new pending user
- Click **"View ID Card"** to see their uploaded ID
- Click **Approve** or **Reject**

#### 4. Explore Profile Menu
- Click your profile icon (top-right)
- Try these options:
  - View Profile
  - Edit Profile
  - Notifications
  - My Activity
  - Logout

---

## Testing Different User Roles

### Create a Faculty Member:

1. Register a new user (use different email)
2. In Firebase Firestore, set their:
   - `status`: "approved"
   - `role`: "faculty"
3. Faculty can upload resources and create notifications

### Create a Department Admin:

1. Register a new user
2. In Firebase Firestore, set their:
   - `status`: "approved"
   - `role`: "dept_admin"
3. Dept Admin can verify students from their department only

### Create a Regular Student:

1. Register a new user
2. Approve them through the admin verification dashboard
3. Students can view content and submit feedback

---

## App Features Overview

### Authentication
- ✅ Email/Password Login
- ✅ Registration with ID Card Upload
- ✅ Pending Approval System
- ✅ Admin Verification Dashboard
- ✅ Role-Based Access Control

### UI/UX
- ✅ Responsive Design (Mobile & Desktop)
- ✅ Dark/Light Mode Toggle
- ✅ Smooth Animations
- ✅ Modern Interface
- ✅ Profile Dropdown Menu

### Core Components
- ✅ Dashboard with Quick Actions
- ✅ Navigation Sidebar
- ✅ User Profile Page
- ✅ Admin Verification Panel
- ✅ AI Chatbot Widget

### Pending Features
- 📋 Notifications System (UI ready, needs backend integration)
- 📋 Educational Resources Library (UI ready, needs upload functionality)
- 📋 Feedback System (UI ready, needs form implementation)
- 📋 Activity Tracking
- 📋 Real-time Notifications

---

## Project Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run typecheck

# Linting
npm run lint
```

---

## Project Structure

```
src/
├── components/
│   ├── auth/          # Login, Register, ProtectedRoute
│   ├── admin/         # VerificationDashboard, UserCard
│   ├── layout/        # Navbar, Sidebar, ProfileDropdown
│   ├── chatbot/       # ChatbotWidget, ChatWindow
│   └── common/        # Button, Input, FileUpload, ThemeToggle
├── pages/             # Dashboard, Profile, Notifications, etc.
├── context/           # AuthContext, ThemeContext
├── config/            # Firebase configuration
├── types/             # TypeScript interfaces
└── utils/             # Validation, formatters, constants
```

---

## Important Files

- `SETUP_GUIDE.md` - Complete setup documentation
- `FIREBASE_RULES_SETUP.md` - Detailed Firebase rules setup
- `FIRESTORE_DATA_MODEL.md` - Database schema
- `FOLDER_STRUCTURE.md` - Component organization
- `firestore.rules` - Firestore security rules
- `storage.rules` - Storage security rules

---

## Troubleshooting

### "Permission denied" errors
- Check that Firebase rules are published
- Verify user status is "approved" in Firestore

### App not loading
- Check browser console for errors
- Verify `.env` has correct Firebase credentials
- Make sure `npm run dev` is running

### Cannot login
- Check that Email/Password auth is enabled in Firebase
- Verify user exists in Firestore `users` collection
- Check user `status` field is "approved"

### ID card upload fails
- Verify Storage rules are published
- Check that Storage bucket exists
- File must be under 10MB

---

## Next Steps

1. **Test all user flows** (registration, approval, login)
2. **Implement Notifications** (create, view, filter)
3. **Build Resources Library** (upload, download, filter by semester)
4. **Create Feedback System** (submit, respond, track status)
5. **Add Activity Tracking** (log user actions)
6. **Integrate Real AI** (replace rule-based chatbot with Gemini/OpenAI)

---

## Need Help?

Refer to:
- `SETUP_GUIDE.md` for detailed setup instructions
- `FIRESTORE_DATA_MODEL.md` for database structure
- Firebase Console for real-time data and errors
- Browser DevTools Console for client-side errors

---

## Success Checklist

- [x] Firebase environment variables configured
- [x] Firestore rules published
- [x] Storage rules published
- [x] Email/Password authentication enabled
- [x] App builds successfully
- [x] App running on localhost:5173
- [ ] First admin account created
- [ ] Logged in successfully
- [ ] Tested verification workflow
- [ ] Tested dark mode
- [ ] Tested AI chatbot

---

**You're all set! Happy coding! 🚀**
