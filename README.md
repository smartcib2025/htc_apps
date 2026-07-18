# Hanuman Tennis Academy - Mobile App

A comprehensive React Native mobile application for managing tennis academy operations, built with Expo, TypeScript, and React 19.

## 🎾 Overview

Hanuman Tennis Academy is a full-featured mobile application designed to streamline operations for tennis academies. It provides role-based access for players, coaches, head coaches, and administrators with features for performance tracking, player evaluation, match statistics, and comprehensive reporting.

## ✨ Key Features

### 🏃 Player Features
- Daily check-in form (training hours, fatigue, confidence, stress, injury tracking)
- Performance progress tracking with radar charts and trend analysis
- Match statistics recording and analysis
- AI-generated performance reports
- Award and achievement tracking
- Calendar event management

### 👨‍🏫 Coach Features
- Player evaluation system (technique, fitness, tactics, mental, discipline, match IQ)
- Team management and player details
- Coaching session tracking and compensation management
- Performance notes and observations
- Video analysis tools with playback controls
- Advanced player filtering and search

### 🎯 Head Coach Features
- Command center dashboard with performance overview
- 360° player view with comprehensive analytics
- Tournament management dashboard
- Coach performance analysis
- Risk assessment and injury prediction
- Real-time notifications dashboard

### 👨‍💼 Admin Features
- User management (CRUD operations)
- Academy settings configuration
- 2FA management dashboard
- Audit logs viewer
- System-wide reporting and analytics
- Email verification and authentication

## 🛠️ Technology Stack

- **Frontend**: React Native 0.81, Expo SDK 54, React 19
- **Styling**: NativeWind 4 (Tailwind CSS)
- **Language**: TypeScript 5.9
- **State Management**: React Context + useReducer
- **API**: tRPC with React Query
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Email-based login with 2FA (TOTP)
- **Email Service**: SendGrid integration
- **Testing**: Vitest

## 📋 Project Structure

```
app/
  (tabs)/                    # Tab-based navigation
    index.tsx               # Home screen
    profile.tsx             # User profile
    team.tsx                # Team management
    matches.tsx             # Match tracking
    progress.tsx            # Performance progress
    reports.tsx             # Report generation
  _layout.tsx               # Root layout with providers
  calendar.tsx              # Calendar system
  email-login.tsx           # Email authentication
  2fa-setup.tsx             # 2FA setup screen
  2fa-verify.tsx            # 2FA verification
  admin-2fa-dashboard.tsx   # Admin 2FA management
  audit-logs-viewer.tsx     # Audit logs viewer
  advanced-search.tsx       # Advanced search
  notifications-dashboard.tsx # Notifications

components/
  screen-container.tsx      # SafeArea wrapper
  themed-view.tsx          # Theme-aware view
  ui/
    icon-symbol.tsx        # Icon mapping

server/
  routers.ts               # tRPC router definitions
  db.ts                    # Database functions
  email-auth.ts            # Email authentication logic
  email-auth-router.ts     # Email auth API endpoints
  2fa-router.ts            # 2FA API endpoints
  admin-2fa-router.ts      # Admin 2FA API endpoints
  calendar-router.ts       # Calendar API endpoints
  email-service.ts         # SendGrid email service
  totp-2fa.ts             # TOTP utilities

drizzle/
  schema.ts               # Database schema
  migrations/             # Database migrations

tests/
  *.test.ts              # Unit tests

lib/
  app-context.tsx        # Global app context
  theme-provider.tsx     # Theme context
  trpc.ts               # tRPC client setup
  utils.ts              # Utility functions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm 9+
- Expo CLI

### Installation

1. Clone the repository:
```bash
git clone https://github.com/smartcib2025/htc_apps.git
cd htc_apps
git checkout develop
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Run database migrations:
```bash
pnpm db:push
```

5. Start the development server:
```bash
pnpm dev
```

6. Open the app in Expo Go:
- Scan the QR code displayed in the terminal
- Or visit the Metro URL in your browser

## 🔐 Authentication

### Email Login
- User registration with email verification
- Password reset functionality
- Account lockout after 5 failed attempts
- Secure password hashing

### Two-Factor Authentication (2FA)
- TOTP-based 2FA using authenticator apps
- Backup codes for account recovery
- Admin dashboard for 2FA management
- 2FA reset and backup codes regeneration

## 📊 Database Schema

### Core Tables
- `users` - User accounts and roles
- `players` - Player information
- `coaches` - Coach information
- `check_ins` - Daily player check-ins
- `evaluations` - Coach evaluations
- `match_stats` - Match statistics
- `reports` - Generated reports
- `awards` - Achievement awards
- `coaching_sessions` - Coaching records

### Authentication & Security
- `email_logins` - Email authentication records
- `access_logs` - Audit logs for all user actions
- `two_factor_settings` - 2FA configuration per user
- `two_factor_logs` - 2FA activity logs

### Calendar & Events
- `calendar_events` - Calendar events
- `event_participants` - Event participant tracking

## 🧪 Testing

Run all tests:
```bash
pnpm test
```

Run tests in watch mode:
```bash
pnpm test:watch
```

Current test coverage: 244+ tests passing

## 📝 API Documentation

### tRPC Routers
- `auth` - Authentication endpoints
- `emailAuth` - Email login endpoints
- `twoFA` - 2FA management endpoints
- `adminTwoFA` - Admin 2FA management
- `calendar` - Calendar event management
- `players` - Player management
- `coaches` - Coach management
- `evaluations` - Evaluation endpoints
- `reports` - Report generation

## 🔧 Configuration

### Theme Configuration
Edit `theme.config.js` to customize colors:
```javascript
const themeColors = {
  primary: { light: '#0a7ea4', dark: '#0a7ea4' },
  background: { light: '#ffffff', dark: '#151718' },
  // ... more colors
};
```

### App Configuration
Edit `app.config.ts` for app details:
- App name
- Bundle ID
- Splash screen
- Permissions

## 📧 Email Service

SendGrid integration for:
- Email verification
- Password reset emails
- 2FA setup emails
- Backup codes delivery

## 🔄 Git Workflow

### Branches
- `main` - Production-ready code
- `develop` - Development branch

### Commit to GitHub
```bash
git add .
git commit -m "feat: add new feature"
git push origin develop
```

## 📦 Deployment

### Build for iOS
```bash
eas build --platform ios
```

### Build for Android
```bash
eas build --platform android
```

### Build for Web
```bash
pnpm build
```

## 🐛 Troubleshooting

### Common Issues

**Metro Bundler not starting:**
```bash
pnpm dev
```

**TypeScript errors:**
```bash
pnpm check
```

**Database migration issues:**
```bash
pnpm db:push
```

## 📄 License

This project is proprietary software for Hanuman Tennis Academy.

## 👥 Team

- **Development**: Smart CIB Team
- **Design**: Hanuman Tennis Academy
- **Testing**: QA Team

## 📞 Support

For issues and questions, please contact the development team at smart.cib.2025@gmail.com

## 🎯 Roadmap

- [ ] WebSocket real-time notifications
- [ ] Biometric authentication (Face ID/Fingerprint)
- [ ] Advanced reporting with PDF export
- [ ] Video streaming integration
- [ ] Payment gateway integration
- [ ] Mobile app store deployment

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [tRPC Documentation](https://trpc.io)
- [NativeWind Docs](https://www.nativewind.dev)

---

**Last Updated**: June 2026
**Version**: 1.0.0
