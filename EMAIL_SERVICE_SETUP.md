# Email Service Setup Guide

## 📧 SendGrid + Firebase Cloud Functions Integration

This guide will help you set up email notifications for the NCP Portal using SendGrid and Firebase Cloud Functions.

---

## 1️⃣ Prerequisites

- Firebase project with Blaze (pay-as-you-go) plan
- SendGrid account (free tier: 100 emails/day)

---

## 2️⃣ SendGrid Setup

### Step 1: Create SendGrid Account
1. Go to [SendGrid](https://sendgrid.com/)
2. Sign up for a free account
3. Verify your email address

### Step 2: Create API Key
1. Go to **Settings** → **API Keys**
2. Click **Create API Key**
3. Name it: `NCP-Portal-Functions`
4. Select **Full Access**
5. Click **Create & View**
6. **Copy the API key** (you won't see it again!)

### Step 3: Verify Sender Email
1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in your details:
   - From Name: `NCP Portal`
   - From Email: Your email (e.g., `noreply@yourdomain.com`)
4. Verify the email address by clicking the link sent to your inbox

**⚠️ Important:** Replace `noreply@ncpportal.com` in the Cloud Functions code with your verified sender email!

---

## 3️⃣ Firebase Setup

### Step 1: Install Firebase CLI
```powershell
npm install -g firebase-tools
```

### Step 2: Login to Firebase
```powershell
firebase login
```

### Step 3: Initialize Firebase in Your Project
From the `project` folder:
```powershell
cd C:\Users\stxrdust\Desktop\Internships\Deltaware_Solution\project
firebase init functions
```

Select:
- Use existing project: `polished-core-455610-k5`
- Language: **TypeScript**
- Use ESLint: **No**
- Install dependencies: **Yes**

### Step 4: Install Dependencies
```powershell
cd functions
npm install
```

### Step 5: Set SendGrid API Key
```powershell
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"
```
Replace `YOUR_SENDGRID_API_KEY` with the API key you copied from SendGrid.

### Step 6: Update Sender Email in Code
Open `functions/src/index.ts` and replace all instances of:
```typescript
from: 'noreply@ncpportal.com'
```
with your verified sender email.

---

## 4️⃣ Deploy Cloud Functions

### Build and Deploy
```powershell
cd functions
npm run build
firebase deploy --only functions
```

This will deploy 4 Cloud Functions:
- `sendNotificationEmail` - Sends email when notification is created
- `sendFeedbackSubmittedEmail` - Sends email when feedback is submitted
- `sendFeedbackReplyEmail` - Sends email when admin replies to feedback
- `sendFeedbackResolvedEmail` - Sends email when feedback is resolved

---

## 5️⃣ Testing

### Test Notification Email
1. Login as admin/faculty
2. Create a new notification
3. Check target users' email inboxes

### Test Feedback Emails
1. Login as student
2. Submit feedback
3. Check admin/faculty email
4. Login as admin and reply
5. Check student email

---

## 6️⃣ Important Notes

### Email Limits
- **SendGrid Free Tier**: 100 emails/day
- **Firebase Functions**: 125K invocations/month (free tier)

### Email Delivery
- Emails may take 1-2 minutes to arrive
- Check spam folder if not received
- SendGrid dashboard shows delivery status

### Costs
- **SendGrid**: Free (up to 100 emails/day)
- **Firebase Functions**: Free tier should cover typical usage
- **Firestore**: Email triggers don't count as reads

### Troubleshooting
```powershell
# View function logs
firebase functions:log

# Test locally (without sending emails)
cd functions
npm run serve
```

---

## 7️⃣ Portal URL Configuration

Update the portal URL in `functions/src/index.ts`:
```typescript
href="https://your-portal-url.com/notifications"
```
Replace with your actual deployed portal URL.

---

## 📊 Monitoring

View SendGrid Dashboard:
- Login to SendGrid
- Go to **Activity** to see email delivery status
- Track opens, clicks, bounces, etc.

View Firebase Logs:
```powershell
firebase functions:log --only sendNotificationEmail
```

---

## 🔒 Security Best Practices

1. ✅ Never commit SendGrid API key to Git
2. ✅ Use Firebase config for sensitive data
3. ✅ Verify sender email to avoid spam
4. ✅ Set up SPF/DKIM records for your domain (optional but recommended)

---

## ✅ You're All Set!

Once deployed, the system will automatically:
- Send emails when notifications are created
- Send emails when feedback is submitted
- Send emails when admins reply to feedback
- Send emails when feedback is resolved

All emails are beautifully styled and mobile-responsive! 🎉
