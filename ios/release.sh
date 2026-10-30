#!/bin/sh
# Builds Kings Corner for the App Store and sends it to App Store Connect, where it shows up in
# TestFlight once processed. The app must already exist in App Store Connect with the bundle ID
# com.kizmiz.kingscorner.
#
#   ios/release.sh          build, sign and upload
#   ios/release.sh export   build and sign only, into ios/build/export (nothing leaves the Mac)
#
# As for Cambio Agents: the team has no registered devices, so Xcode can't make the
# development-signed archive its Archive button needs. The archive is built unsigned and signed
# locally, and xcodebuild then signs it for the App Store with the team's cloud-managed distribution
# certificate (registering the bundle ID with the team the first time). The build number is the
# time of the build, so every upload is newer than the last.
set -eu
cd "$(dirname "$0")"
team=M9NWLMKT6B
mode=${1:-upload}
build=build
number=$(date +%Y%m%d%H%M)

rm -rf "$build/KingsCorner.xcarchive" "$build/export" "$build/upload"
mkdir -p "$build"
echo "Archiving build $number..."
xcodebuild archive -project KingsCorner.xcodeproj -scheme KingsCorner -configuration Release \
  -destination 'generic/platform=iOS' -archivePath "$build/KingsCorner.xcarchive" \
  CODE_SIGNING_ALLOWED=NO CURRENT_PROJECT_VERSION="$number" -quiet
codesign --force --sign - "$build/KingsCorner.xcarchive/Products/Applications/KingsCorner.app"

options() {
  cat > "$build/$1.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>method</key><string>app-store-connect</string>
	<key>destination</key><string>$1</string>
	<key>teamID</key><string>$team</string>
	<key>signingStyle</key><string>automatic</string>
	<key>uploadSymbols</key><true/>
	<key>manageAppVersionAndBuildNumber</key><false/>
</dict>
</plist>
EOF
}

options export
xcodebuild -exportArchive -archivePath "$build/KingsCorner.xcarchive" -exportOptionsPlist "$build/export.plist" \
  -exportPath "$build/export" -allowProvisioningUpdates -quiet
echo "Signed for the App Store: $build/export/KingsCorner.ipa"

if [ "$mode" = upload ]; then
  echo "Uploading build $number to App Store Connect..."
  options upload
  xcodebuild -exportArchive -archivePath "$build/KingsCorner.xcarchive" -exportOptionsPlist "$build/upload.plist" \
    -exportPath "$build/upload" -allowProvisioningUpdates
fi
