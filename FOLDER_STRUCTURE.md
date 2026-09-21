# React Folder Structure - University NCP

```
src/
├── main.tsx                      # Entry point
├── App.tsx                       # Root component with routing
├── index.css                     # Global styles
├── vite-env.d.ts                 # Vite types
│
├── config/
│   └── firebase.ts               # Firebase initialization
│
├── types/
│   └── index.ts                  # TypeScript interfaces
│
├── context/
│   ├── AuthContext.tsx           # Authentication state management
│   └── ThemeContext.tsx          # Dark/Light mode management
│
├── hooks/
│   ├── useAuth.ts                # Auth hook
│   ├── useFirestore.ts           # Firestore operations hook
│   └── useStorage.ts             # Firebase Storage hook
│
├── utils/
│   ├── validation.ts             # Form validation utilities
│   ├── formatters.ts             # Date/text formatters
│   └── constants.ts              # App constants
│
├── services/
│   ├── authService.ts            # Authentication operations
│   ├── userService.ts            # User CRUD operations
│   ├── notificationService.ts    # Notification operations
│   ├── resourceService.ts        # Resource operations
│   ├── feedbackService.ts        # Feedback operations
│   └── chatbotService.ts         # AI chatbot integration
│
├── components/
│   ├── auth/
│   │   ├── Login.tsx             # Login form
│   │   ├── Register.tsx          # Registration with ID upload
│   │   └── ProtectedRoute.tsx    # Route protection wrapper
│   │
│   ├── layout/
│   │   ├── Layout.tsx            # Main layout wrapper
│   │   ├── Navbar.tsx            # Navigation bar
│   │   ├── Sidebar.tsx           # Sidebar navigation
│   │   └── ProfileDropdown.tsx   # Profile menu dropdown
│   │
│   ├── admin/
│   │   ├── VerificationDashboard.tsx   # Pending users approval
│   │   ├── UserCard.tsx                # User verification card
│   │   └── AdminStats.tsx              # Statistics display
│   │
│   ├── notifications/
│   │   ├── NotificationList.tsx        # All notifications
│   │   ├── NotificationCard.tsx        # Single notification
│   │   └── CreateNotification.tsx      # Create new notification
│   │
│   ├── resources/
│   │   ├── ResourceLibrary.tsx         # Resource browsing
│   │   ├── ResourceCard.tsx            # Resource display card
│   │   ├── ResourceUpload.tsx          # Upload form (faculty)
│   │   └── ResourceFilters.tsx         # Filter controls
│   │
│   ├── feedback/
│   │   ├── FeedbackForm.tsx            # Submit feedback
│   │   ├── FeedbackList.tsx            # All feedback items
│   │   └── FeedbackDetails.tsx         # Single feedback view
│   │
│   ├── profile/
│   │   ├── ProfileView.tsx             # View profile
│   │   ├── EditProfile.tsx             # Edit profile form
│   │   └── MyActivity.tsx              # User activity history
│   │
│   ├── chatbot/
│   │   ├── ChatbotWidget.tsx           # Floating chat bubble
│   │   ├── ChatWindow.tsx              # Chat interface
│   │   └── MessageBubble.tsx           # Individual message
│   │
│   └── common/
│       ├── Button.tsx                  # Reusable button
│       ├── Input.tsx                   # Form input
│       ├── Modal.tsx                   # Modal dialog
│       ├── Card.tsx                    # Card wrapper
│       ├── Badge.tsx                   # Status badges
│       ├── LoadingSpinner.tsx          # Loading indicator
│       ├── ThemeToggle.tsx             # Theme switcher
│       └── FileUpload.tsx              # File upload component
│
└── pages/
    ├── Dashboard.tsx                   # Main dashboard (role-based)
    ├── NotificationsPage.tsx           # Notifications page
    ├── ResourcesPage.tsx               # Resources page
    ├── FeedbackPage.tsx                # Feedback page
    └── AdminPage.tsx                   # Admin verification page
```

## Component Responsibilities

### Auth Components
- **Login.tsx**: Email/password login with status validation
- **Register.tsx**: Registration form with ID card upload and roll number validation
- **ProtectedRoute.tsx**: Checks authentication and approval status

### Layout Components
- **Layout.tsx**: Main wrapper with navbar, sidebar, and content area
- **Navbar.tsx**: Top navigation with logo, search, and profile icon
- **ProfileDropdown.tsx**: Dropdown menu with Edit Profile, Notifications, My Activity

### Admin Components
- **VerificationDashboard.tsx**: Lists pending users, approve/reject functionality
- **UserCard.tsx**: Displays user details and ID card image

### Resource Components
- **ResourceLibrary.tsx**: Main view with filters and resource cards
- **ResourceUpload.tsx**: Faculty-only upload form
- **ResourceFilters.tsx**: Semester, subject, and tag filters

### Chatbot Components
- **ChatbotWidget.tsx**: Floating bottom-right bubble
- **ChatWindow.tsx**: Chat interface with message history
- Academic constraint validation

## Routing Structure

```typescript
/ → Login (if not authenticated)
/register → Registration form
/dashboard → Role-based dashboard (approved users only)
/notifications → All notifications
/resources → Educational content library
/feedback → Submit and view feedback
/admin → Admin verification dashboard (admin only)
/profile → User profile view
/profile/edit → Edit profile
/profile/activity → My activity log
```

## State Management

- **AuthContext**: Current user, role, status, login/logout
- **ThemeContext**: Dark/light mode toggle
- Local state for forms and UI interactions
- Firestore real-time listeners for live data
