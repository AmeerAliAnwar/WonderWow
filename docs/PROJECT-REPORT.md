# WonderWoW - Project Report

## Abstract

WonderWoW is a mobile application for children that bundles six educational mini-games into a single Android package. The application is built with web technologies (HTML5, CSS3 and JavaScript) and packaged as a native Android application using Apache Cordova. Every game is a client-side web application, which keeps the codebase portable, allows testing in a desktop browser, and still produces an installable APK through the Cordova build pipeline.

## 1. Introduction

The project was created as a semester project with the goal of designing, implementing and packaging a child-friendly game collection for Android. The application presents a colourful dashboard from which six games are launched with a single tap. Each game is independent: it contains its own layout, styles, artwork and logic, and returns to the dashboard through the hardware back button.

## 2. Objectives

- Provide six independent, age-appropriate mini-games in one application.
- Keep navigation simple: a dashboard, one-tap launch and hardware back-button support.
- Package the collection as an installable Android APK.
- Keep each game self-contained so it can be developed, documented and tested in isolation.
- Document the project (report, user manual, testing) and publish the source code and the built APK.

## 3. Methodology

Development followed an iterative process. Each game was first built and tested in a desktop browser, then integrated into the dashboard and finally packaged with Cordova for testing on Android devices. Successive numbered builds were produced during development; the final build is shipped as `WonderWow_v11.apk`.

## 4. Technologies Used

| Area | Technology |
| --- | --- |
| Front end | HTML5, CSS3, JavaScript (ES6) |
| Graphics | HTML canvas, inline/SVG artwork |
| Audio | Web Audio API, HTML5 audio, speech synthesis |
| Packaging | Apache Cordova 12, cordova-android 13 |
| Android | minSdk 22 (Android 5.1), target/compile SDK 34 |
| Tooling | Node.js, npm, Cordova CLI, Git, GitHub |

## 5. System Architecture

The application is a single Cordova web page (`www/index.html`) that acts as the dashboard. Selecting a game loads its page into a full-screen iframe. A Cordova `backbutton` handler and a `popstate` handler return the user to the dashboard, and on the dashboard the back button exits the app.

```
Android device
└── WebView (Cordova)
    └── Dashboard (www/index.html)
        ├── css/dashboard.css, js/dashboard.js
        └── iframe -> www/games/<game>/index.html
                (each game is self-contained)
```

All six games run entirely on the device inside the WebView. Games that use public CDNs (fonts, artwork, sound effects, UI libraries) require an internet connection; the remaining games work fully offline.

## 6. Game Modules

### 6.1 Realm Guardians (`achi-game`)
A tower defence game with four maps: Green Fields (5 waves), Blue River (8 waves), Spooky Forest (10 waves) and Magic Castle (12 waves). The player builds one of four towers - Fire Blaster (splash damage), Ice Cannon (slowing), Leaf Shooter (poison) and Magic Laser (long-range sniper) - and uses the lifelines Meteor, Freeze and Heal. Enemies include Blob, Speedy and Tank units, with a boss on each map.

### 6.2 Jungle Animals (`animal-game`)
An interactive scene with fifteen jungle animals. Tapping an animal plays its sound and speaks its name using speech synthesis. Designed for vocabulary building in young children.

### 6.3 Coloring World (`coloring`)
A digital colouring book. The child selects colours from a crayon palette and colours the picture by touching the screen. Sound effects accompany the interactions.

### 6.4 Pip's Adventure (`passing-game`)
An obstacle adventure with twenty short levels that cycle through four themes: jungle, mountain, volcano and village. Each level presents an instruction (for example "Jump on the Rock!" or "A bonfire blocks the path! Use Water.") and the correct action lets Pip pass the obstacle and reach the house at the end of the level.

### 6.5 Scratch & Match (`scratch-card`)
A scratch-to-reveal memory matching game. Twelve tiles hide six pairs of cartoon pictures. The player scrubs a tile to reveal the picture underneath; roughly one third of the surface must be scratched before the tile counts as revealed. Every matched pair awards 20 coins, and when all six pairs are found a celebration plays and the board reshuffles. All artwork is embedded, so the game is fully offline.

### 6.6 Puzzle Fun (`puzzle-game`)
A 3x3 sliding puzzle. The board is shuffled with 15 random valid moves and the player slides tiles into the empty space until the picture is back in order. The game shows the number of moves used, plays a victory sound and is fully offline.

## 7. Testing

The games were exercised on Android devices throughout development, and the final build was verified before release. As an additional integrity check, all 23 web assets in this repository were compared byte-for-byte (SHA-256) against the assets packaged inside `WonderWow_v11.apk`; all 23 matched. The test cases are listed in [TESTING.md](TESTING.md).

## 8. Results

The project produced a working Android application of approximately 3.3 MB that installs on Android 5.1 and newer. All six games launch from the dashboard, run correctly, and return to the dashboard with the hardware back button. The source tree is buildable with the standard Cordova toolchain and is published together with the built APK.

## 9. Limitations

- Four games load fonts, artwork, sound effects or UI libraries from public CDNs and therefore need an internet connection on first use.
- Puzzle Fun ships with placeholder audio files; its active sound effects are synthesised at runtime with the Web Audio API.
- Coins and progress are not persisted between sessions.
- The application icon is a placeholder resource.

## 10. Future Enhancements

- Bundle all CDN dependencies locally so every game works fully offline.
- Persist scores and coins using local storage.
- Replace placeholder artwork, audio and the application icon with final assets.
- Add difficulty levels (for example 4x4 and 5x5 puzzle sizes) and more games.

## 11. Conclusion

WonderWoW demonstrates that a complete, installable mobile game collection can be built with web technologies and packaged with Apache Cordova. The modular dashboard architecture kept the six games independent and testable, and the final package is small, installable and suitable for young children.
