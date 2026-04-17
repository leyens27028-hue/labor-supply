#!/bin/bash
# Setup mobile apps with Capacitor
# Run from project root: bash scripts/setup-mobile.sh

set -e

echo "📱 Setting up mobile apps..."

cd frontend

# Install Capacitor
echo "📦 Installing Capacitor..."
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/push-notifications

# Build web app first
echo "🔨 Building web app..."
npm run build

# Initialize Capacitor (if not already done)
if [ ! -d "android" ]; then
  echo "🤖 Adding Android platform..."
  npx cap add android
fi

if [ ! -d "ios" ]; then
  echo "🍎 Adding iOS platform..."
  npx cap add ios
fi

# Sync web assets to native projects
echo "🔄 Syncing web assets..."
npx cap sync

echo ""
echo "✅ Mobile setup complete!"
echo ""
echo "📱 To run on Android:"
echo "   cd frontend && npx cap open android"
echo "   (Opens Android Studio - build and run from there)"
echo ""
echo "🍎 To run on iOS (macOS only):"
echo "   cd frontend && npx cap open ios"
echo "   (Opens Xcode - build and run from there)"
echo ""
echo "📦 To build APK (Android):"
echo "   cd frontend/android"
echo "   ./gradlew assembleRelease"
echo "   APK at: android/app/build/outputs/apk/release/"
echo ""
echo "📦 To build AAB for Google Play:"
echo "   cd frontend/android"
echo "   ./gradlew bundleRelease"
echo ""
