# Firestore Data Model - University NCP

## Collections Structure

### 1. users
**Purpose:** Store all user information including students, faculty, admins

```typescript
{
  uid: string,                    // Firebase Auth UID
  name: string,
  email: string,
  department: string,             // e.g., "BIT", "BCS", "BSE"
  rollNumber: string,             // e.g., "FA23-BIT-053"
  role: "student" | "faculty" | "dept_admin" | "super_admin",
  status: "pending" | "approved" | "rejected",
  idCardUrl: string,              // Firebase Storage URL
  profilePicUrl: string | null,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastLogin: Timestamp | null
}
```

**Indexes:**
- `email` (for login queries)
- `status` (for admin verification dashboard)
- `department` + `status` (for dept admin filtering)
- `role` (for RBAC queries)

---

### 2. notifications
**Purpose:** Store all system notifications and announcements

```typescript
{
  id: string,
  title: string,
  message: string,
  type: "announcement" | "assignment" | "alert" | "system",
  createdBy: string,              // User UID
  createdByName: string,          // Cache for display
  department: string | "all",     // Target department or "all"
  targetRoles: string[],          // ["student", "faculty"] or ["all"]
  priority: "low" | "medium" | "high",
  isRead: Map<string, boolean>,   // { userId: true/false }
  attachments: Array<{
    name: string,
    url: string,
    type: string
  }> | null,
  createdAt: Timestamp,
  expiresAt: Timestamp | null
}
```

**Indexes:**
- `department` + `createdAt` (for filtering by dept)
- `type` + `createdAt` (for filtering by type)
- `targetRoles` array (for role-based queries)

---

### 3. resources
**Purpose:** Educational content repository (PDFs, PPTs, etc.)

```typescript
{
  id: string,
  title: string,
  description: string,
  subject: string,                // e.g., "Data Structures", "OOP"
  semester: string,               // e.g., "1", "2", "3", "4", "5", "6", "7", "8"
  department: string,
  fileUrl: string,                // Firebase Storage URL
  fileName: string,
  fileSize: number,               // in bytes
  fileType: string,               // "pdf", "pptx", "docx", etc.
  uploadedBy: string,             // User UID (faculty)
  uploadedByName: string,
  downloads: number,              // Download counter
  tags: string[],                 // ["midterm", "lecture", "notes"]
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Indexes:**
- `department` + `semester` + `subject` (for filtering)
- `uploadedBy` (for faculty's uploaded content)
- `tags` array (for tag-based search)

---

### 4. feedback
**Purpose:** Student feedback and queries

```typescript
{
  id: string,
  userId: string,                 // Student UID
  userName: string,
  userEmail: string,
  department: string,
  category: "academic" | "technical" | "administrative" | "general",
  subject: string,
  message: string,
  status: "submitted" | "in_progress" | "resolved" | "closed",
  priority: "low" | "medium" | "high",
  assignedTo: string | null,      // Admin/Faculty UID
  responses: Array<{
    respondedBy: string,          // User UID
    respondedByName: string,
    message: string,
    createdAt: Timestamp
  }>,
  attachments: Array<{
    name: string,
    url: string
  }> | null,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  resolvedAt: Timestamp | null
}
```

**Indexes:**
- `userId` (for user's feedback history)
- `status` + `createdAt` (for admin dashboard)
- `department` + `status` (for dept admin filtering)

---

### 5. activity_logs
**Purpose:** Track user actions for audit and "My Activity" section

```typescript
{
  id: string,
  userId: string,
  userName: string,
  action: string,                 // e.g., "uploaded_resource", "submitted_feedback", "approved_user"
  targetType: "user" | "notification" | "resource" | "feedback",
  targetId: string,
  details: string,                // Human-readable description
  metadata: object,               // Additional context
  timestamp: Timestamp
}
```

**Indexes:**
- `userId` + `timestamp` (for user activity history)
- `timestamp` (for recent activity feed)

---

### 6. chatbot_conversations
**Purpose:** Store AI chatbot conversation history

```typescript
{
  id: string,
  userId: string,
  messages: Array<{
    role: "user" | "assistant",
    content: string,
    timestamp: Timestamp,
    isAcademic: boolean           // Was query academic?
  }>,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastMessageAt: Timestamp
}
```

**Indexes:**
- `userId` + `updatedAt` (for user's chat history)

---

## Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
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

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isAuthenticated() &&
        (request.auth.uid == userId || isAdmin());
    }

    // Notifications collection
    match /notifications/{notificationId} {
      allow read: if isApproved();
      allow create, update, delete: if isAdmin() || isFaculty();
    }

    // Resources collection
    match /resources/{resourceId} {
      allow read: if isApproved();
      allow create: if isFaculty();
      allow update, delete: if isFaculty() &&
        resource.data.uploadedBy == request.auth.uid;
    }

    // Feedback collection
    match /feedback/{feedbackId} {
      allow read: if isApproved();
      allow create: if isApproved();
      allow update: if isAdmin() ||
        (isAuthenticated() && resource.data.userId == request.auth.uid);
    }

    // Activity logs
    match /activity_logs/{logId} {
      allow read: if isAuthenticated() &&
        (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated();
    }

    // Chatbot conversations
    match /chatbot_conversations/{conversationId} {
      allow read, write: if isAuthenticated() &&
        resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## Storage Structure (Firebase Storage)

```
/id_cards/{userId}/{timestamp}_{filename}
/profile_pictures/{userId}/{timestamp}_{filename}
/resources/{department}/{semester}/{resourceId}_{filename}
/feedback_attachments/{feedbackId}/{timestamp}_{filename}
/notification_attachments/{notificationId}/{timestamp}_{filename}
```

---

## Query Examples

### Get Pending Users for Admin Verification
```typescript
const q = query(
  collection(db, "users"),
  where("status", "==", "pending"),
  orderBy("createdAt", "desc")
);
```

### Get Department-Specific Resources
```typescript
const q = query(
  collection(db, "resources"),
  where("department", "==", userDepartment),
  where("semester", "==", selectedSemester),
  orderBy("createdAt", "desc")
);
```

### Get Unread Notifications for User
```typescript
const q = query(
  collection(db, "notifications"),
  where("targetRoles", "array-contains", userRole),
  where(`isRead.${userId}`, "==", false),
  orderBy("createdAt", "desc"),
  limit(10)
);
```
