@echo off
echo Setting up mobile apps...

cd frontend

echo Installing Capacitor...
call npm install @capacitor/core @capacitor/cli
call npm install @capacitor/android @capacitor/ios
call npm install @capacitor/splash-screen @capacitor/status-bar @capacitor/push-notifications

echo Building web app...
call npm run build

if not exist "android" (
    echo Adding Android platform...
    call npx cap add android
)

echo Syncing web assets...
call npx cap sync

echo.
echo ========================================
echo  Mobile setup complete!
echo ========================================
echo.
echo To open Android Studio:
echo   cd frontend
echo   npx cap open android
echo.
echo To build APK:
echo   cd frontend\android
echo   gradlew assembleRelease
echo.

cd ..
pause
