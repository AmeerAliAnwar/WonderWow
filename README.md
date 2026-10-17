# WonderWoW

WonderWoW is a collection of six educational mini-games for children, packaged as a single Android application with Apache Cordova. The app opens on a game dashboard; each game runs full screen and returns to the dashboard with a single press of the back button.

## Games

| Game | Folder | Description |
| --- | --- | --- |
| Realm Guardians | `www/games/achi-game` | Tower defence: build elemental towers and stop monster waves across four themed maps |
| Jungle Animals | `www/games/animal-game` | Interactive animals: tap an animal to hear its sound and its name |
| Coloring World | `www/games/coloring` | Digital colouring book with a crayon palette |
| Pip's Adventure | `www/games/passing-game` | Obstacle adventure with 20 levels across four environment themes |
| Scratch & Match | `www/games/scratch-card` | Scratch-to-reveal memory matching game with a coin counter |
| Puzzle Fun | `www/games/puzzle-game` | 3x3 sliding puzzle with a move counter and victory animation |

## Download

The prebuilt installer is included in this repository:

- [`apk/WonderWow_v11.apk`](apk/WonderWow_v11.apk)

To install: copy the APK to an Android device, allow installation from unknown sources when prompted, then open the file.

## Requirements

- Android 5.1 (API level 22) or newer; built against Android API 34.
- An internet connection the first time most games are opened. Realm Guardians, Jungle Animals, Coloring World and Pip's Adventure load fonts, artwork, sounds or UI libraries from public CDNs. Scratch & Match and Puzzle Fun work fully offline.
- Most games are designed for landscape orientation and lock it on supported devices.

## Project Structure

```
WonderWoW/
├── apk/                  Prebuilt Android application package
├── config.xml            Cordova project configuration
├── package.json          Build tooling and dependency definitions
├── res/                  Android resources
├── www/                  Application front end (Cordova web root)
│   ├── index.html        Game dashboard
│   ├── css/              Dashboard styles
│   ├── js/               Dashboard navigation logic
│   └── games/            Six self-contained game modules
└── docs/                 Project report, user manual, testing documentation
```

## Building from Source

Prerequisites: Node.js 16 or newer, Java JDK 11 or newer, Android SDK (through Android Studio) and the Cordova CLI.

```
npm install -g cordova
npm install
cordova platform add android
cordova build android
```

The debug APK is written to `platforms/android/app/build/outputs/apk/debug/`.

## Documentation

- [Project Report](docs/PROJECT-REPORT.md)
- [User Manual](docs/USER-MANUAL.md)
- [Testing Documentation](docs/TESTING.md)

## Technology

HTML5, CSS3 and JavaScript (ES6), running inside the Android WebView and packaged with Apache Cordova 12 (`cordova-android` 13).

## License

Released under the [MIT License](LICENSE).
