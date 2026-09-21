<div align="center">

# University Notification & Communication Portal (NCP)

A modern, full-featured web platform for university communication and resource management built with React, TypeScript, Firebase, and Tailwind CSS.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![React](https://img.shields.io/badge/React-18.3-61dafb)
![Firebase](https://img.shields.io/badge/Firebase-12.6-orange)

</div>

---

## Features

### Core Functionality
- **User Authentication**: Email/password registration with ID card verification
- **Admin Approval System**: Pending user verification with ID card review
- **Role-Based Access Control**: Student, Faculty, Department Admin, Super Admin
- **Dark/Light Mode**: Persistent theme switching
- **Responsive Design**: Optimized for mobile and desktop
- **AI Chatbot**: Academic-focused assistant with context-aware responses

### User Roles & Permissions

| Role | Permissions |
|------|------------|
| **Student** | View notifications, download resources, submit feedback |
| **Faculty** | Upload resources, post assignments, all student permissions |
| **Dept Admin** | Verify department students, post announcements, all faculty permissions |
| **Super Admin** | Manage all departments, full system access |

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Icons**: Lucide React
- **Routing**: React Router v7
- **Font**: Inter (Google Fonts)

---

## Quick Start

### Prerequisites
- Node.js 18+
- Firebase account
- npm or yarn

### 1. Install Dependencies
```bash
npm install --include=dev
```

### 2. Configure Firebase
Update `.env` with your Firebase credentials (already done).

### 3. Set Up Firebase Rules
Follow instructions in `FIREBASE_RULES_SETUP.md` to:
- Publish Firestore security rules
- Publish Storage security rules
- Enable Email/Password authentication

### 4. Run Development Server
```bash
npm run dev
```

### 5. Create First Admin
See `QUICK_START.md` for step-by-step instructions.

---

## Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get started in 5 minutes
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup documentation
- **[FIREBASE_RULES_SETUP.md](./FIREBASE_RULES_SETUP.md)** - Firebase Console configuration
- **[FIRESTORE_DATA_MODEL.md](./FIRESTORE_DATA_MODEL.md)** - Database schema
- **[FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)** - Project organization

---

## Project Structure

```
university-ncp/
├── src/
│   ├── components/       # Reusable React components
│   ├── pages/           # Page-level components
│   ├── context/         # React Context providers
│   ├── config/          # Firebase configuration
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── public/              # Static assets
├── firestore.rules      # Firestore security rules
├── storage.rules        # Storage security rules
└── [documentation].md   # Setup and reference docs
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Lint code with ESLint |

---

## Key Components

### Authentication Flow
1. **Register** → Upload ID card → Set to "pending" status
2. **Admin Review** → View ID card → Approve/Reject
3. **Login** → Status check → Redirect to dashboard or pending page

### Admin Dashboard
- View pending users with statistics
- Preview ID cards in modal
- Approve or reject with one click
- Department filtering for dept admins

### User Interface
- Top navigation with profile dropdown
- Sidebar with role-based menu items
- Dashboard with quick actions
- Theme toggle (light/dark mode)

### AI Chatbot
- Floating chat bubble (bottom-right)
- Academic-only responses
- Context-aware suggestions
- Smooth animations

---

## Firebase Collections

### users
User profiles with authentication data, department, role, and status.

### notifications
Announcements and alerts from faculty/administration.

### resources
Educational materials (PDFs, slides) organized by semester and subject.

### feedback
Student queries and feedback with response tracking.

### activity_logs
User action tracking for audit and activity history.

### chatbot_conversations
AI chatbot conversation history.

See `FIRESTORE_DATA_MODEL.md` for detailed schema.

---

## Security

### Firestore Rules
- Authenticated users can only read/write their own data
- Admins can approve/reject pending users
- Faculty can upload resources and create notifications
- Students have read-only access to approved content

### Storage Rules
- ID cards visible only to owner and admins
- Profile pictures visible to all authenticated users
- Resources can be uploaded by faculty only
- Appropriate permissions for attachments

---

## Development Status

### ✅ Completed
- User registration with ID card upload
- Admin verification dashboard
- Role-based access control
- Authentication flow (login/register/pending)
- Profile management
- Dark/light mode
- Responsive design
- AI chatbot widget
- Navigation and layout

### 🚧 In Progress
- Notifications system (UI ready)
- Resources library (UI ready)
- Feedback form (UI ready)

### 📋 Planned
- Real-time notifications
- Activity tracking implementation
- Advanced search and filtering
- Email notifications
- Real AI integration (Gemini/OpenAI)
- Mobile app (React Native)

---

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Performance

- Build size: ~857KB (gzipped: 230KB)
- First load: < 2s
- Lighthouse score: 90+

Optimization recommendations:
- Code splitting with dynamic imports
- Manual chunk optimization
- Image lazy loading

---

## Contributing

This is a university project. For internal contributions:
1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit for review

---

## Troubleshooting

### Common Issues

**Build fails**
```bash
npm install --include=dev
npm run build
```

**Permission denied errors**
- Verify Firebase rules are published
- Check user status is "approved"

**Cannot upload files**
- Check Storage rules are published
- Verify file size < 10MB

See `QUICK_START.md` for more troubleshooting tips.

---

## Environment Variables

Required in `.env`:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

Optional:
```env
VITE_GEMINI_API_KEY=your_gemini_key
VITE_OPENAI_API_KEY=your_openai_key
```

---

## License

This project is developed as part of a university coursework.

---

## Acknowledgments

- React team for the amazing framework
- Firebase team for backend services
- Tailwind CSS for utility-first styling
- Lucide for beautiful icons
- Framer Motion for smooth animations

---

## Contact & Support

For issues or questions:
1. Check the documentation files
2. Review Firebase Console logs
3. Check browser console for errors
4. Contact project maintainers

<p align="center">
  <b>Made with ❤️ for educational purposes</b>
</p>
