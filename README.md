# Cadence Optimizer

An intelligent running coach that provides personalized cadence recommendations based on FIT file analysis and real-time terrain detection.

## Features

- **FIT File Analysis**: Parse Garmin .FIT files for personalized recommendations
- **Advanced Metronome**: Multiple modes including terrain-adaptive coaching
- **Race Target Calculator**: Optimize cadence for specific race goals
- **Terrain Detection**: Real-time GPS-based cadence adjustments

## Setup

### Prerequisites

1. **Install Node.js** (version 16 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **Install Expo CLI**
   ```bash
   npm install -g @expo/cli
   ```

3. **Install Expo Go app** on your phone
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Running the App

1. **Install dependencies**
   ```bash
   cd CadenceOptimizer
   npm install
   ```

2. **Start the development server**
   ```bash
   npm start
   ```

3. **Run on your device**
   - Scan the QR code with Expo Go app
   - Or press 'i' for iOS simulator, 'a' for Android emulator

## Project Structure

```
CadenceOptimizer/
├── App.js                 # Main app component with navigation
├── src/
│   ├── screens/          # Main app screens
│   │   ├── HomeScreen.js
│   │   ├── AnalysisScreen.js
│   │   ├── MetronomeScreen.js
│   │   └── TargetsScreen.js
│   ├── services/         # Core logic (coming soon)
│   ├── components/       # Reusable components (coming soon)
│   └── utils/           # Helper functions (coming soon)
├── app.json             # Expo configuration
└── package.json         # Dependencies
```

## Next Steps

- [x] Implement FIT file parsing
- [x] Build cadence calculation algorithms
- [x] Add audio metronome functionality
- [ ] Integrate GPS location services
- [ ] Add data persistence
- [ ] Implement terrain detection

## FIT File Support

The app now supports comprehensive FIT file analysis with the following features:

### Supported Data Sources
- **Garmin devices** (native FIT format)
- **Wahoo, Polar, Suunto, Coros** watches
- **Strava exports** (download as FIT)
- **TrainingPeaks** data
- **Any device** that exports FIT files

### Analysis Features
- **Cadence Statistics**: Average, min/max, variability analysis
- **Cadence Zones**: Time spent in optimal (160-180 SPM) vs sub-optimal ranges
- **Terrain Impact**: Cadence changes on uphill, downhill, and flat terrain
- **Personalized Recommendations**: Specific advice based on your running patterns
- **Run Summary**: Distance, duration, pace, heart rate analysis

### How to Use
1. Go to the Analysis tab
2. Tap "Select FIT File"
3. Choose your .FIT file from Garmin Connect, Strava, etc.
4. View detailed cadence analysis and recommendations

## Cadence Algorithms

The app now includes intelligent cadence optimization algorithms:

### Smart Recommendations
- **Pace-Based Cadence**: Optimal cadence calculated for target race pace
- **Experience Level Adjustments**: Recommendations adapted for beginner to elite runners
- **Distance Optimization**: Different cadence strategies for 5K vs marathon
- **Terrain Adaptation**: Real-time adjustments for uphill/downhill/flat terrain

### Advanced Analysis
- **Efficiency Scoring**: How well your cadence matches your pace
- **Pattern Recognition**: Identifies fatigue, terrain adaptation issues
- **Progression Planning**: Week-by-week cadence improvement plans
- **Confidence Scoring**: Algorithm confidence in recommendations

### Target Calculator
- Enter race goals and get personalized cadence targets
- Advanced calculator with experience level, terrain, and distance factors
- Training progression plans to reach optimal cadence
- Real-time terrain adjustment recommendations

## Audio Metronome

The app now includes a full-featured audio metronome with visual indicators:

### Audio Features
- **Multiple Sound Types**: Click, beep, tick, and wood sounds
- **Volume Control**: Adjustable volume with visual slider
- **Accent Beats**: Every 4th beat is accented for running rhythm (left/right foot)
- **Cross-Platform Audio**: Web Audio API for browsers, Expo AV for mobile

### Visual Beat Indicators
- **Animated Pulse Circle**: Large circle that pulses and changes color with each beat
- **Rhythm Pattern Display**: 4-dot pattern showing current beat position with L/R foot indicators
- **Beat Visualization Waveform**: Animated bar chart showing beat pattern
- **Real-time Status**: Beat counter, BPM, interval timing, and audio status

### Smart Controls
- **Cadence Adjustment**: -5/+5 SPM buttons (disabled while playing)
- **Quick Settings**: Preset cadences (160, 170, 180, 190 SPM)
- **Audio Toggle**: Enable/disable audio while keeping visual indicators
- **Mode Selection**: Basic, interval, progressive, and terrain-adaptive modes

## Development Notes

This is built with React Native and Expo for cross-platform mobile development. The app requires location permissions for terrain detection and audio permissions for metronome functionality.