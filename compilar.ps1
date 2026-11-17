# 1) Cargar las variables de .env en el proceso (EXPO_PUBLIC_GOOGLE_CLIENT_ID, etc.)      
Get-Content .env | ForEach-Object {                                 
   if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
     [Environment]::SetEnvironmentVariable($matches[1], $matches[2].Trim(), 'Process')
  }
}

# 2) Usar el JDK que trae Android Studio
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

# 3) Compilar
cd android
.\gradlew.bat assembleRelease "-PreactNativeArchitectures=arm64-v8a,armeabi-v7a" --console=plain   