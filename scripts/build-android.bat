@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ============================================
echo   BUILD ANDROID APK - Cung Ung Lao Dong
echo ============================================
echo.

:: ===== CHECK PREREQUISITES =====
echo [1/7] Kiem tra moi truong...

:: Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [LOI] Chua cai Node.js! Tai tai: https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do echo   Node.js: %%v

:: Check Java
where java >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [LOI] Chua cai Java JDK 17!
    echo.
    echo Hay cai Java truoc khi chay script nay:
    echo   1. Tai JDK 17 tai: https://adoptium.net/temurin/releases/?version=17
    echo      Chon: Windows x64 .msi
    echo   2. Cai dat, tick "Set JAVA_HOME variable"
    echo   3. Khoi dong lai CMD va chay lai script nay
    echo.
    pause
    exit /b 1
)
for /f "tokens=3" %%v in ('java -version 2^>^&1 ^| findstr /i "version"') do echo   Java: %%v

:: Check ANDROID_HOME
if not defined ANDROID_HOME (
    :: Try common locations
    if exist "%LOCALAPPDATA%\Android\Sdk" (
        set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
    ) else if exist "C:\Android\Sdk" (
        set "ANDROID_HOME=C:\Android\Sdk"
    ) else (
        echo.
        echo [LOI] Chua cai Android SDK!
        echo.
        echo Hay cai Android Studio hoac Android Command Line Tools:
        echo.
        echo CACH 1 - Android Studio (de nhat):
        echo   1. Tai tai: https://developer.android.com/studio
        echo   2. Cai dat Android Studio
        echo   3. Mo Android Studio ^> More Actions ^> SDK Manager
        echo   4. Cai: Android SDK Platform 34, Android SDK Build-Tools
        echo   5. Dat bien moi truong:
        echo      ANDROID_HOME = %LOCALAPPDATA%\Android\Sdk
        echo      Them vao PATH: %LOCALAPPDATA%\Android\Sdk\platform-tools
        echo.
        echo CACH 2 - Command Line Tools (nhe hon):
        echo   1. Tai: https://developer.android.com/studio#command-line-tools-only
        echo   2. Giai nen vao: %LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest
        echo   3. Chay: sdkmanager "platforms;android-34" "build-tools;34.0.0"
        echo   4. Dat ANDROID_HOME nhu tren
        echo.
        echo Sau khi cai xong, khoi dong lai CMD va chay lai script nay.
        pause
        exit /b 1
    )
)
echo   Android SDK: %ANDROID_HOME%

:: Verify SDK has required components
if not exist "%ANDROID_HOME%\platforms" (
    echo [LOI] Android SDK thieu platforms! Mo SDK Manager de cai "Android SDK Platform 34"
    pause
    exit /b 1
)

set "PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools;%ANDROID_HOME%\tools\bin;%PATH%"

echo   [OK] Moi truong san sang!
echo.

:: ===== SET PROJECT DIR =====
set "PROJECT_DIR=%~dp0.."
cd /d "%PROJECT_DIR%\frontend"

:: ===== STEP 2: Install dependencies =====
echo [2/7] Cai dat dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [LOI] npm install that bai!
    pause
    exit /b 1
)

:: ===== STEP 3: Install Capacitor =====
echo.
echo [3/7] Cai dat Capacitor...
call npm install @capacitor/core @capacitor/cli 2>nul
call npm install @capacitor/android 2>nul
call npm install @capacitor/splash-screen @capacitor/status-bar 2>nul
echo   [OK] Capacitor da cai!
echo.

:: ===== STEP 4: Build web app =====
echo [4/7] Build web app...
call npm run build
if %errorlevel% neq 0 (
    echo [LOI] Build that bai!
    pause
    exit /b 1
)
echo   [OK] Build thanh cong! Output: frontend\dist\
echo.

:: ===== STEP 5: Add Android platform =====
echo [5/7] Them Android platform...
if not exist "android" (
    call npx cap add android
    if %errorlevel% neq 0 (
        echo [LOI] Khong the them Android platform!
        pause
        exit /b 1
    )
)
echo   [OK] Android platform san sang!
echo.

:: ===== STEP 6: Sync web to Android =====
echo [6/7] Dong bo web app vao Android...
call npx cap sync android
if %errorlevel% neq 0 (
    echo [LOI] Sync that bai!
    pause
    exit /b 1
)
echo   [OK] Dong bo thanh cong!
echo.

:: ===== STEP 7: Build APK =====
echo [7/7] Build APK...
cd android

:: Build debug APK
call gradlew.bat assembleDebug
if %errorlevel% neq 0 (
    echo.
    echo [LOI] Build APK that bai!
    echo Neu loi "SDK location not found":
    echo   1. Tao file: frontend\android\local.properties
    echo   2. Them dong: sdk.dir=C\:\\Users\\%USERNAME%\\AppData\\Local\\Android\\Sdk
    echo   3. Chay lai script
    pause
    exit /b 1
)

:: Copy APK to project root
set "APK_SOURCE=app\build\outputs\apk\debug\app-debug.apk"
set "APK_DEST=%PROJECT_DIR%\CungUngLaoDong.apk"

if exist "%APK_SOURCE%" (
    copy /Y "%APK_SOURCE%" "%APK_DEST%" >nul
    echo.
    echo ============================================
    echo   BUILD THANH CONG!
    echo ============================================
    echo.
    echo   File APK: %APK_DEST%
    echo.
    echo   Cach cai len dien thoai:
    echo     1. Copy file CungUngLaoDong.apk sang dien thoai
    echo     2. Mo file ^> Cho phep cai tu nguon khong xac dinh
    echo     3. Cai dat va mo app
    echo.
    echo   Hoac cai qua USB (can bat USB Debugging):
    echo     adb install "%APK_DEST%"
    echo.
) else (
    echo [LOI] Khong tim thay file APK!
    echo Kiem tra: frontend\android\%APK_SOURCE%
)

cd /d "%PROJECT_DIR%"
pause
