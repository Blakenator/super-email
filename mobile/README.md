# StacksMail Mobile App

React Native mobile application for StacksMail, built with Expo for iOS and Android.

## Features

- 📥 **Inbox Management** - View, search, and manage emails across all folders
- 👆 **Biometric Authentication** - Face ID, Touch ID, and fingerprint login
- 🔔 **Push Notifications** - Real-time notifications for new emails
- 📴 **Offline Support** - Cached emails available without internet
- 🎨 **Dark/Light Mode** - Automatic theme based on system preference
- 👥 **Contacts** - Manage your address book
- 💣 **Inbox Zero** - Bulk archive old emails with Nuke feature
- ⚙️ **Full Settings** - Configure email accounts, SMTP, tags, and rules

## Prerequisites

- Node.js 18+ 
- pnpm 8+
- Expo CLI: `pnpm add -g expo-cli`
- For iOS: macOS with Xcode 15+
- For Android: Android Studio with SDK 34+

## Quick Start

### 1. Install Dependencies

```bash
# From the project root
pnpm install

# Or from the mobile directory
cd mobile
pnpm install
```

### 2. Configure Environment

Create a `.env` file in the mobile directory:

```bash
# Copy the example env file
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Backend API URL
EXPO_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

### 3. Start Development Server

```bash
# Start Expo development server
pnpm start

# Or with specific platform
pnpm run ios      # iOS Simulator
pnpm run android  # Android Emulator
```

## Testing on Real Device

### iOS (iPhone/iPad)

1. **Install Expo Go** from the App Store
2. Start the dev server: `pnpm start`
3. Scan the QR code with your iPhone camera
4. Or press `i` in terminal to open iOS Simulator

### Android

1. **Install Expo Go** from Google Play Store
2. Start the dev server: `pnpm start`
3. Scan the QR code with Expo Go app
4. Or press `a` in terminal to open Android Emulator

### Development Builds (For Full Features)

For features like push notifications and biometrics that require native code:

```bash
# Create a development build
pnpm run prebuild

# iOS
cd ios && pod install && cd ..
open ios/StacksMail.xcworkspace

# Android
cd android && ./gradlew assembleDebug
```

## Building for Production

### Using EAS Build (Recommended)

1. **Install EAS CLI**:
   ```bash
   pnpm add -g eas-cli
   ```

2. **Configure EAS**:
   ```bash
   eas build:configure
   ```

3. **Build for both platforms**:
   ```bash
   pnpm run build:all
   ```

4. **Or build for specific platform**:
   ```bash
   pnpm run build:ios      # iOS App Store build
   pnpm run build:android  # Android Play Store build
   ```

### Local Builds

For local builds without EAS:

```bash
# iOS Release Build
pnpm run build:local:ios

# Android Release Build  
pnpm run build:local:android
```

## Configuration Reference

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | Yes |
| `EXPO_PUBLIC_API_BASE_URL` | Backend API base URL | Yes |

### Where to Find Config Values

1. **Supabase URL & Key**:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Navigate to Settings → API
   - Copy "Project URL" and "anon public" key

2. **API Base URL**:
   - Development: Use your local IP (e.g., `http://192.168.1.100:4000`)
   - Production: Your deployed backend URL

### Push Notifications Setup

#### iOS

1. Create an Apple Developer account
2. Generate APNs key in Apple Developer Portal
3. Add the key to your Expo/EAS project
4. Configure in `app.json`:
   ```json
   {
     "expo": {
       "ios": {
         "bundleIdentifier": "com.yourcompany.stacksmail"
       }
     }
   }
   ```

#### Android

1. Create a Firebase project
2. Download `google-services.json`
3. Place in `mobile/` directory
4. Firebase Cloud Messaging is auto-configured by Expo

### Biometric Authentication

Biometric authentication is automatically available on supported devices:
- **iOS**: Face ID (iPhone X+) or Touch ID
- **Android**: Fingerprint, Face Unlock, or Iris Scanner

Users can enable biometric login in Settings → Security.

## Project Structure

```
mobile/
├── App.tsx                 # Main app entry
├── app.json               # Expo configuration
├── assets/                # Images, icons, fonts
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Button, Input, etc.
│   │   └── email/        # Email-specific components
│   ├── config/           # Environment configuration
│   ├── navigation/       # React Navigation setup
│   ├── screens/          # Screen components
│   │   ├── auth/         # Login, Signup
│   │   ├── inbox/        # Email list, folders
│   │   ├── contacts/     # Contact management
│   │   ├── settings/     # App settings
│   │   └── nuke/         # Inbox zero feature
│   ├── services/         # API, auth, storage
│   ├── stores/           # Zustand state management
│   └── theme/            # Colors, typography
├── package.json
└── tsconfig.json
```

## Troubleshooting

### Common Issues

**"Unable to resolve module"**
```bash
# Clear Metro bundler cache
pnpm start --clear
```

**iOS Simulator not opening**
```bash
# Reset simulator
xcrun simctl shutdown all
xcrun simctl erase all
```

**Android build failing**
```bash
# Clean Android build
cd android && ./gradlew clean && cd ..
```

**Push notifications not working**
- Ensure you're testing on a real device (not simulator)
- Check that notification permissions are granted
- Verify Firebase/APNs configuration

### Debug Mode

Enable debug logging:
```bash
EXPO_DEBUG=true pnpm start
```

### Getting Help

- Check [Expo Documentation](https://docs.expo.dev/)
- Review [React Navigation Docs](https://reactnavigation.org/)
- Open an issue in the project repository

## Scripts Reference

| Script | Description |
|--------|-------------|
| `pnpm start` | Start Expo development server |
| `pnpm run ios` | Run on iOS Simulator |
| `pnpm run android` | Run on Android Emulator |
| `pnpm run web` | Run in web browser |
| `pnpm run prebuild` | Generate native projects |
| `pnpm run build:ios` | Build iOS with EAS |
| `pnpm run build:android` | Build Android with EAS |
| `pnpm run build:all` | Build both platforms |
| `pnpm run typecheck` | TypeScript type checking |
| `pnpm run lint` | ESLint code checking |

## License

Private - All rights reserved.
