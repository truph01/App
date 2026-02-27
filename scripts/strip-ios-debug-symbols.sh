#!/bin/bash
#
# Strips debug symbols from the app binary and embedded frameworks for non-Debug builds.
# This reduces the IPA size by ~22MB without affecting crash symbolication, because Xcode
# generates dSYMs from the unstripped binary before this phase runs.
#
# Expected Xcode environment variables:
#   CONFIGURATION, BUILT_PRODUCTS_DIR, EXECUTABLE_FOLDER_PATH, EXECUTABLE_NAME

set -e

case "$CONFIGURATION" in
  Debug*)
    echo "Skipping symbol stripping for $CONFIGURATION build."
    exit 0
    ;;
esac

APP_DIR_PATH="${BUILT_PRODUCTS_DIR}/${EXECUTABLE_FOLDER_PATH}"

echo "Stripping main binary: ${APP_DIR_PATH}/${EXECUTABLE_NAME}"
strip -rSTx "${APP_DIR_PATH}/${EXECUTABLE_NAME}"

APP_FRAMEWORKS_DIR="${APP_DIR_PATH}/Frameworks"
if [ -d "$APP_FRAMEWORKS_DIR" ]; then
  find "$APP_FRAMEWORKS_DIR" -maxdepth 2 -mindepth 2 -type f -perm -111 -exec bash -c '
    codesign -v -R="anchor apple" "$1" &> /dev/null || strip -rSTx "$1"
  ' _ {} \;
else
  echo "No Frameworks directory found at $APP_FRAMEWORKS_DIR"
fi

echo "Symbol stripping complete."
