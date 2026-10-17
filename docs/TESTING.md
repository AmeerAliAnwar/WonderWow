# WonderWoW - Testing Documentation

## Test Environment

- Build environment: Windows, Node.js, npm, Cordova CLI 12, cordova-android 13, Android SDK 34.
- Target environment: Android devices (Android 5.1 or newer) with the application installed from `apk/WonderWow_v11.apk`.
- The games were exercised on Android devices throughout development, through successive numbered builds up to the final build v11.

## Test Cases

| ID | Test | Steps | Expected result | Result |
| --- | --- | --- | --- | --- |
| TC-01 | Installation | Copy the APK to a device and install it | App installs and appears in the app drawer | Passed |
| TC-02 | First launch | Open the app | Dashboard appears with six game cards and no errors | Passed |
| TC-03 | Realm Guardians | Open the game, start a map, build a tower | Map loads, towers can be built, enemies spawn in waves | Passed |
| TC-04 | Jungle Animals | Open the game, tap an animal | Animal sound plays and the name is spoken | Passed |
| TC-05 | Coloring World | Open the game, select a crayon, colour the picture | Colour appears on the picture; sound effects play | Passed |
| TC-06 | Pip's Adventure | Open the game, follow the level instruction | Correct action clears the obstacle and completes the level | Passed |
| TC-07 | Scratch & Match | Open the game, scratch a tile, find a pair | Tile reveals after roughly one third is scratched; matching pair adds 20 coins | Passed |
| TC-08 | Puzzle Fun | Open the game, tap a tile next to the empty space | Tile slides; solving shows the move count and victory sound | Passed |
| TC-09 | Back navigation | Press the device back button inside each game | App returns to the dashboard | Passed |
| TC-10 | Exit behaviour | Press the back button on the dashboard | App closes | Passed |
| TC-11 | Orientation | Open games that lock landscape | Orientation locks to landscape | Passed |
| TC-12 | Offline gameplay | Disable the network, open Scratch & Match and Puzzle Fun | Both games are fully playable offline | Passed |
| TC-13 | Network-dependent games | Disable the network, open Realm Guardians, Jungle Animals, Coloring World or Pip's Adventure | Documented dependency: these games need the internet on first use | Observed |
| TC-14 | Asset integrity | Compare every web asset in this repository with the files packaged in `WonderWow_v11.apk` (SHA-256) | All 23 assets are byte-identical | Passed |

## Asset Integrity Verification

The complete web front end was compared against the packaged APK to confirm that this repository is the exact source of the shipped build: all 23 files under `www/` produced identical SHA-256 hashes to their counterparts in `assets/www/` inside `WonderWow_v11.apk`. The only differences are the four Cordova plugin bootstrap files (`cordova.js`, `cordova_plugins.js` and plugin scripts), which are generated automatically by the Cordova build process and are not part of the source tree.

## Notes

- TC-13 is an observed behaviour rather than a failure: the network requirement of the four CDN-based games is a known limitation, documented in the project report and user manual.
- The build procedure for reproducing the APK from source is given in the repository README.
