#!/usr/bin/env bash
# Construit android/dist/pulse.apk à partir du site (index.html, css/, js/).
# Prérequis : Java 17+ (javac, keytool), Python 3, curl. Le SDK Android n'est PAS nécessaire :
# les outils sont téléchargés depuis Maven Central dans android/.cache.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$HERE")"
CACHE="$HERE/.cache"
BUILD="$HERE/build"
DIST="$HERE/dist"
M=https://repo.maven.apache.org/maven2

ANDROID_ALL="$CACHE/android-all-14.jar"   # framework Android 14 (API 34) publié par Robolectric
DX="$CACHE/dalvik-dx-16.0.1.jar"           # compilateur .class -> .dex
APKSIG="$CACHE/apksig-2.3.0.jar"           # signature APK v2

fetch() { [ -s "$2" ] || { echo "↓ $(basename "$2")"; curl -sSfL --retry 3 -o "$2.part" "$1" && mv "$2.part" "$2"; }; }
mkdir -p "$CACHE"
fetch "$M/org/robolectric/android-all/14-robolectric-10818077/android-all-14-robolectric-10818077.jar" "$ANDROID_ALL"
fetch "$M/com/jakewharton/android/repackaged/dalvik-dx/16.0.1/dalvik-dx-16.0.1.jar" "$DX"
fetch "$M/com/android/tools/build/apksig/2.3.0/apksig-2.3.0.jar" "$APKSIG"

rm -rf "$BUILD"; mkdir -p "$BUILD/classes" "$BUILD/tools" "$BUILD/www" "$DIST"

echo "• Compilation Java"
javac -nowarn -Xlint:-deprecation --release 8 -cp "$ANDROID_ALL" -d "$BUILD/classes" $(find "$HERE/src" -name '*.java') 2>&1 | grep -v "^Picked up\|warning: \[options\]\|^1 warning" || true
java -cp "$DX" com.android.dx.command.Main --dex --min-sdk-version=24 --output="$BUILD/classes.dex" "$BUILD/classes"

echo "• Copie du site"
cp "$ROOT/index.html" "$BUILD/www/"
cp -r "$ROOT/css" "$ROOT/js" "$ROOT/fonts" "$BUILD/www/"

echo "• Assemblage"
python3 "$HERE/tools/apkbuild.py" "$BUILD/classes.dex" "$BUILD/www" "$HERE/res/icon.png" "$BUILD/unsigned.apk"

echo "• Signature"
KEYSTORE="${PULSE_KEYSTORE:-$HERE/pulse-debug.p12}"
STOREPASS="${PULSE_STOREPASS:-pulse-debug}"
ALIAS="${PULSE_KEYALIAS:-pulse}"
if [ ! -f "$KEYSTORE" ]; then
  keytool -genkeypair -keystore "$KEYSTORE" -storetype PKCS12 -storepass "$STOREPASS" -alias "$ALIAS" \
    -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Pulse, O=Pulse Live Coding" 2>&1 | grep -v "^Picked up" || true
fi
javac -nowarn -cp "$APKSIG" -d "$BUILD/tools" "$HERE/tools/Sign.java" 2>&1 | grep -v "^Picked up" || true
java --add-exports java.base/sun.security.x509=ALL-UNNAMED --add-exports java.base/sun.security.pkcs=ALL-UNNAMED --add-exports java.base/sun.security.util=ALL-UNNAMED -cp "$APKSIG:$BUILD/tools" Sign "$KEYSTORE" "$STOREPASS" "$ALIAS" "$BUILD/unsigned.apk" "$DIST/pulse.apk" 2>&1 | grep -v "^Picked up"

echo "✓ $(du -h "$DIST/pulse.apk" | cut -f1)  →  $DIST/pulse.apk"
