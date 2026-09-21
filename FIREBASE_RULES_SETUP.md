# Firebase Rules Setup Guide

Follow these steps to configure your Firebase project security rules.

---

## Step 1: Set Up Firestore Security Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **polished-core-455610-k5**
3. Click on **Build** → **Firestore Database** in the left sidebar
4. Click on the **Rules** tab at the top
5. **Delete all existing content** in the rules editor
6. **Copy the entire content** from the file: `firestore.rules` (in your project root)
7. **Paste it** into the Firebase rules editor
8. Click **Publish** button

The rules should look like this at the top:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    ...
```

### What These Rules Do:
- Allow authenticated users to read/create their own user profile
- Only approved users can access the app features
- Admins can approve/reject users
- Faculty can upload resources and create notifications
- Students can submit feedback and view content

---

## Step 2: Set Up Firebase Storage Rules

1. Still in Firebase Console
2. Click on **Build** → **Storage** in the left sidebar
3. Click on the **Rules** tab at the top
4. **Delete all existing content** in the rules editor
5. **Copy the entire content** from the file: `storage.rules` (in your project root)
6. **Paste it** into the Firebase rules editor
7. Click **Publish** button

The rules should look like this at the top:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // ID Cards - Only accessible by owner and admins
    ...
```

### What These Rules Do:
- ID cards are only visible to the owner and admins
- Profile pictures are visible to all authenticated users
- Educational resources can be uploaded by faculty
- Attachments have appropriate read/write permissions

---

## Step 3: Verify Services Are Enabled

### Enable Authentication
1. Go to **Build** → **Authentication**
2. Click **Get Started** (if not already enabled)
3. Click **Sign-in method** tab
4. Enable **Email/Password**
5. Make sure **Email link (passwordless sign-in)** is DISABLED
6. Save

### Verify Firestore Database
1. Go to **Build** → **Firestore Database**
2. You should see an empty database
3. The database will automatically create collections when users register

### Verify Storage
1. Go to **Build** → **Storage**
2. Click **Get Started** (if not already enabled)
3. Choose **Start in production mode**
4. Use default location
5. You should see an empty storage bucket

---

## Step 4: Check Rules Are Active

### Test Firestore Rules
1. Go to **Firestore Database** → **Rules** tab
2. Look for **"Last published"** timestamp at the top
3. It should say something like "Published just now"

### Test Storage Rules
1. Go to **Storage** → **Rules** tab
2. Look for **"Last published"** timestamp at the top
3. It should say something like "Published just now"

---

## Common Issues & Fixes

### Issue: "Firestore permission denied"
**Solution:** Make sure you published the Firestore rules and they contain the helper functions.

### Issue: "Storage upload fails"
**Solution:** Verify Storage rules are published and the bucket name matches your project.

### Issue: "Cannot read user data"
**Solution:** Ensure the user document was created in Firestore after registration.

---

## What Happens Next?

Once the rules are set up:

1. **Registration Flow:**
   - User registers with email, password, and ID card
   - Account status is set to "pending"
   - User is redirected to pending approval page

2. **Admin Approval:**
   - Admin logs in (you'll need to manually create the first admin)
   - Admin sees pending users in verification dashboard
   - Admin views ID card and approves/rejects

3. **Approved User:**
   - User can now login
   - Access to dashboard, notifications, resources, feedback
   - Can use AI chatbot

---

## Creating Your First Admin User

Since you need an admin to approve users, here's how to create one:

### Method 1: Register Then Manually Promote (Recommended)

1. Start the app: `npm run dev`
2. Register a new account with your details
3. Go to Firebase Console → Firestore Database
4. Click on the **users** collection
5. Find your user document (by email)
6. Click on the document
7. Edit two fields:
   - `status`: Change from "pending" to "approved"
   - `role`: Change from "student" to "super_admin"
8. Click **Update**
9. Now logout and login again - you're an admin!

### Method 2: Direct Creation in Firestore

1. Go to Firebase Console → Firestore Database
2. Click **Start collection**
3. Collection ID: `users`
4. Add a document with:
   - Document ID: (will be set after creating auth user)
   - Fields: name, email, status, role, etc.
5. Then create the auth user in Authentication section

**Method 1 is easier!**

---

## Verification Checklist

- [ ] Firestore rules published
- [ ] Storage rules published
- [ ] Email/Password authentication enabled
- [ ] Firestore database created
- [ ] Storage bucket created
- [ ] Rules show recent "Last published" timestamp
- [ ] Ready to run the app!

---

## Next Step

Once all rules are set up, run:
```bash
npm run dev
```

Then open: http://localhost:5173

You're ready to use the app! 🎉
