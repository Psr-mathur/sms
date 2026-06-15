# Set error action to stop to catch errors early
$ErrorActionPreference = "Stop"

$rootDir = "d:\PSR-REP\VS\sms"
$sdkDir = "$rootDir\android-sdk"
$frontendDir = "$rootDir\frontend"
$zipUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
$zipPath = "$sdkDir\commandlinetools.zip"
$jdk21Dir = "$sdkDir\jdk-21"

Write-Host "=== Starting Android SDK & JDK 21 Setup & APK Build ===" -ForegroundColor Cyan

# 1. Ensure SDK directory exists
if (-not (Test-Path -Path $sdkDir)) {
    Write-Host "Creating Android SDK folder at $sdkDir..." -ForegroundColor Green
    New-Item -ItemType Directory -Path $sdkDir -Force | Out-Null
}

# 2. Download Command Line Tools if they don't exist
$sdkManager = "$sdkDir\cmdline-tools\latest\bin\sdkmanager.bat"
if (-not (Test-Path -Path $sdkManager)) {
    if (-not (Test-Path -Path $zipPath)) {
        Write-Host "Downloading Android SDK Command Line Tools from Google..." -ForegroundColor Green
        $ProgressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath
        Write-Host "Download complete!" -ForegroundColor Green
    }
    
    Write-Host "Extracting Command Line Tools..." -ForegroundColor Green
    $tempExtract = "$sdkDir\temp_extract"
    if (Test-Path -Path $tempExtract) {
        Remove-Item -Path $tempExtract -Recurse -Force
    }
    Expand-Archive -Path $zipPath -DestinationPath $tempExtract -Force
    
    # Move cmdline-tools directory to its final location: cmdline-tools/latest
    $destCmdlineTools = "$sdkDir\cmdline-tools\latest"
    if (Test-Path -Path $destCmdlineTools) {
        Remove-Item -Path $destCmdlineTools -Recurse -Force
    }
    
    # Create parent folder for cmdline-tools
    New-Item -ItemType Directory -Path "$sdkDir\cmdline-tools" -Force | Out-Null
    
    # Move contents
    Move-Item -Path "$tempExtract\cmdline-tools" -Destination $destCmdlineTools -Force
    
    # Clean up zip and temp folder
    if (Test-Path -Path $zipPath) {
        Remove-Item -Path $zipPath -Force
    }
    if (Test-Path -Path $tempExtract) {
        Remove-Item -Path $tempExtract -Recurse -Force
    }
    Write-Host "Command Line Tools extraction completed!" -ForegroundColor Green
} else {
    Write-Host "Android Command Line Tools already installed." -ForegroundColor Green
}

# 3. Download and Install OpenJDK 21 if it doesn't exist (required for compiling Capacitor 6 Java sources)
if (-not (Test-Path -Path $jdk21Dir)) {
    $jdkZipPath = "$sdkDir\jdk21.zip"
    $jdkUrl = "https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/adoptium"
    
    Write-Host "Downloading OpenJDK 21 (Adoptium Temurin) for Java 21 compilation..." -ForegroundColor Green
    $ProgressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $jdkUrl -OutFile $jdkZipPath
    Write-Host "Download complete! Extracting OpenJDK 21..." -ForegroundColor Green
    
    $tempJdkExtract = "$sdkDir\temp_jdk"
    if (Test-Path -Path $tempJdkExtract) {
        Remove-Item -Path $tempJdkExtract -Recurse -Force
    }
    Expand-Archive -Path $jdkZipPath -DestinationPath $tempJdkExtract -Force
    
    $extractedFolder = Get-ChildItem -Path $tempJdkExtract -Directory | Select-Object -First 1
    Move-Item -Path $extractedFolder.FullName -Destination $jdk21Dir -Force
    
    # Cleanup
    if (Test-Path -Path $jdkZipPath) {
        Remove-Item -Path $jdkZipPath -Force
    }
    if (Test-Path -Path $tempJdkExtract) {
        Remove-Item -Path $tempJdkExtract -Recurse -Force
    }
    Write-Host "OpenJDK 21 installation completed!" -ForegroundColor Green
} else {
    Write-Host "OpenJDK 21 already installed." -ForegroundColor Green
}

# 4. Accept Licenses
Write-Host "Accepting Android SDK licenses..." -ForegroundColor Green
$y = @("y") * 50
$y | &$sdkManager --sdk_root=$sdkDir --licenses | Out-Null

# 5. Install SDK Platform and Build Tools
Write-Host "Installing Android platform-tools, platforms;android-34, build-tools;34.0.0..." -ForegroundColor Green
&$sdkManager --sdk_root=$sdkDir "platform-tools" "platforms;android-34" "build-tools;34.0.0"

# 6. Configure local.properties for Gradle
Write-Host "Configuring local.properties with Android SDK path..." -ForegroundColor Green
$localPropertiesPath = "$frontendDir\android\local.properties"
$forwardSdkDir = $sdkDir -replace '\\', '/'
"sdk.dir=$forwardSdkDir" | Out-File -FilePath $localPropertiesPath -Encoding ascii -Force
Write-Host "local.properties set up successfully." -ForegroundColor Green

# 7. Run Vite Production Build
Write-Host "Running Vite frontend production build..." -ForegroundColor Green
Set-Location -Path $frontendDir
npm run build

# 8. Sync files to Capacitor Android project
Write-Host "Syncing web assets to Capacitor Android native project..." -ForegroundColor Green
npx cap sync

# 9. Compile the APK using Gradle with JDK 21
Write-Host "Setting JAVA_HOME to local JDK 21..." -ForegroundColor Green
$env:JAVA_HOME = $jdk21Dir

Write-Host "Compiling Android APK using Gradle..." -ForegroundColor Green
Set-Location -Path "$frontendDir\android"
.\gradlew.bat assembleDebug

# 10. Copy the resulting APK
$builtApk = "$frontendDir\android\app\build\outputs\apk\debug\app-debug.apk"
$targetApk = "$frontendDir\sms-app.apk"

if (Test-Path -Path $builtApk) {
    Copy-Item -Path $builtApk -Destination $targetApk -Force
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host "SUCCESS! APK was compiled successfully." -ForegroundColor Green
    Write-Host "APK Location: $targetApk" -ForegroundColor Green
    $apkSize = (Get-Item $targetApk).Length / 1MB
    Write-Host "APK Size: $('{0:N2}' -f $apkSize) MB" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
} else {
    Write-Error "Build succeeded, but compiled APK could not be found at $builtApk!"
}
