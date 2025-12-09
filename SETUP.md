# Setup Instructions

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v16 or higher)
   - Check version: `node --version`
   - Download from: https://nodejs.org/

2. **npm** (comes with Node.js)
   - Check version: `npm --version`

## Installation Steps

### 1. Install Dependencies

Open your terminal in the CadenceOptimizer directory and run:

```bash
npm install
```

This will install all required packages including:
- React Native and Expo
- Navigation libraries
- File system and document picker
- Audio and location services
- AsyncStorage for data persistence

### 2. Install Expo CLI (if not already installed)

```bash
npm install -g @expo/cli
```

### 3. Install Expo Go on Your Phone

- **iOS**: Download from [App Store](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: Download from [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Running the App

### Start Development Server

```bash
npm start
```

This will:
- Start the Metro bundler
- Display a QR code in your terminal
- Open Expo DevTools in your browser

### Run on Your Device

1. **Using Expo Go App**:
   - Open Expo Go on your phone
   - Scan the QR code from the terminal
   - The app will load on your device

2. **Using iOS Simulator** (Mac only):
   - Press `i` in the terminal
   - Requires Xcode to be installed

3. **Using Android Emulator**:
   - Press `a` in the terminal
   - Requires Android Studio and emulator setup

## Project Structure

```
CadenceOptimizer/
├── App.js                          # Main app entry point
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── babel.config.js                 # Babel configuration
├── src/
│   ├── screens/                    # App screens
│   │   ├── HomeScreen.js          # Home dashboard
│   │   ├── AnalysisScreen.js      # FIT file analysis
│   │   ├── MetronomeScreen.js     # Audio metronome
│   │   └── TargetsScreen.js       # Race target calculator
│   ├── services/                   # Core business logic
│   │   ├── FitFileParser.js       # FIT file parsing
│   │   ├── CadenceAnalyzer.js     # Cadence analysis algorithms
│   │   ├── TerrainDetector.js     # GPS terrain detection
│   │   └── MetronomeService.js    # Metronome functionality
│   ├── components/                 # Reusable UI components (to be added)
│   └── utils/                      # Helper functions
│       ├── storage.js             # AsyncStorage utilities
│       └── calculations.js        # Cadence/pace calculations
└── assets/                         # Images and icons (to be added)
```

## Next Steps

The project structure is now set up with:
- ✅ Navigation between 4 main screens
- ✅ Service layer for core logic
- ✅ Utility functions for calculations and storage
- ✅ Basic UI for all screens

### To Implement:

1. **FIT File Parsing**: Add fit-file-parser library
2. **Audio Metronome**: Implement expo-av audio playback
3. **GPS Integration**: Add location tracking
4. **Data Visualization**: Add charts for analysis results
5. **Runner Profile**: Create profile setup flow

## Troubleshooting

### Port Already in Use
If you see "Port 8081 already in use":
```bash
killall node
npm start
```

### Metro Bundler Issues
Clear cache and restart:
```bash
npm start -- --clear
```

### Module Not Found
Reinstall dependencies:
```bash
rm -rf node_modules
npm install
```

## Development Tips

- Use `console.log()` for debugging - logs appear in terminal
- Shake your device to open developer menu
- Enable "Fast Refresh" for instant updates
- Use React DevTools for component inspection

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
