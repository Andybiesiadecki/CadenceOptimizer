# Development Roadmap

## Phase 1: Core Infrastructure ✅ COMPLETE

- [x] Project structure setup
- [x] Navigation system (4 tabs)
- [x] Basic UI for all screens
- [x] Service layer architecture
- [x] Utility functions for calculations
- [x] Storage utilities

## Phase 2: FIT File Analysis (Next Priority)

### 2.1 File Upload & Parsing
- [ ] Install `fit-file-parser` package
- [ ] Implement document picker in AnalysisScreen
- [ ] Parse FIT file binary data
- [ ] Extract cadence, speed, HR, GPS data
- [ ] Handle parsing errors gracefully

### 2.2 Data Analysis
- [ ] Calculate average/min/max cadence
- [ ] Identify cadence zones (optimal vs sub-optimal)
- [ ] Analyze cadence vs pace correlation
- [ ] Detect patterns (fatigue, terrain adaptation)
- [ ] Generate personalized recommendations

### 2.3 Results Display
- [ ] Create ResultsDisplay component
- [ ] Add charts for cadence over time
- [ ] Show efficiency metrics
- [ ] Display terrain impact analysis
- [ ] Save analysis to history

## Phase 3: Audio Metronome

### 3.1 Basic Metronome
- [ ] Implement expo-av audio playback
- [ ] Create metronome sounds (click, beep, tick, wood)
- [ ] Add volume control
- [ ] Implement accent beats (every 4th)
- [ ] Add visual beat indicators

### 3.2 Advanced Features
- [ ] Interval mode (alternating cadences)
- [ ] Progressive mode (gradual increase/decrease)
- [ ] Terrain-adaptive mode
- [ ] Background audio support
- [ ] Haptic feedback option

## Phase 4: Runner Profile System

### 4.1 Profile Setup
- [ ] Create RunnerProfileSetup component
- [ ] Collect biometric data (height, weight, age)
- [ ] Assess fitness level
- [ ] Set running goals
- [ ] Save profile to AsyncStorage

### 4.2 Profile Integration
- [ ] Use profile in cadence calculations
- [ ] Personalize recommendations
- [ ] Track progress over time
- [ ] Allow profile editing

## Phase 5: Terrain Detection

### 5.1 GPS Integration
- [ ] Request location permissions
- [ ] Implement real-time GPS tracking
- [ ] Calculate elevation changes
- [ ] Detect terrain type (uphill/downhill/flat)

### 5.2 Real-time Adjustments
- [ ] Adjust metronome cadence based on terrain
- [ ] Provide audio cues for terrain changes
- [ ] Display current terrain on screen
- [ ] Log terrain data for analysis

## Phase 6: Race Target Calculator

### 6.1 Enhanced Calculator
- [ ] Implement multi-factor algorithm
- [ ] Add experience level input
- [ ] Consider terrain profile
- [ ] Factor in weather conditions
- [ ] Generate pacing strategy

### 6.2 Training Plans
- [ ] Create progression plans
- [ ] Week-by-week cadence targets
- [ ] Workout recommendations
- [ ] Progress tracking

## Phase 7: Data Visualization

### 7.1 Charts & Graphs
- [ ] Install charting library (react-native-chart-kit)
- [ ] Cadence vs pace scatter plot
- [ ] Cadence over time line chart
- [ ] Heart rate zone distribution
- [ ] Terrain profile visualization

### 7.2 Historical Analysis
- [ ] Compare multiple runs
- [ ] Track improvement trends
- [ ] Identify patterns across runs
- [ ] Export data as CSV

## Phase 8: Smart Music Integration 🎵

### 8.1 Music Library Analysis
- [ ] Connect to device music library (iOS Music, Spotify, etc.)
- [ ] Analyze BPM (beats per minute) of user's songs
- [ ] Build database of song tempos and metadata
- [ ] Cache BPM analysis for performance

### 8.2 Cadence-Music Matching Algorithm
- [ ] Match target cadence (SPM) to song BPM (1:1 ratio - 180 SPM = 180 BPM)
- [ ] Support multiple matching ratios (1:1, 2:1, 1:2 for flexibility)
- [ ] Create tolerance ranges (±5-10 BPM flexibility)
- [ ] Prioritize user's favorite genres/artists

### 8.3 Smart Playlist Generation
- [ ] Auto-generate playlists for target cadence
- [ ] "Warm-up" songs (slower tempo)
- [ ] "Main workout" songs (target tempo)
- [ ] "Cool-down" songs (slower tempo)
- [ ] Save and share custom cadence playlists

### 8.4 Real-Time Music Coaching
- [ ] Suggest songs during runs based on current cadence
- [ ] Seamless handoff between metronome and music
- [ ] "Music mode" vs "Metronome mode" toggle
- [ ] Visual indicators when song matches cadence perfectly

### 8.5 Music Platform Integration
- [ ] Spotify API integration for streaming
- [ ] Apple Music integration (iOS)
- [ ] YouTube Music support
- [ ] Local music library access
- [ ] Cross-platform playlist sync

### 8.6 Advanced Music Features
- [ ] Tempo adjustment (speed up/slow down songs slightly)
- [ ] Beat detection and visualization
- [ ] Song recommendations based on running performance
- [ ] "Power songs" for interval training
- [ ] Mood-based music selection

## Phase 9: Advanced Features

### 9.1 Device Integration
- [ ] Bluetooth heart rate monitor support
- [ ] GPS watch connectivity
- [ ] Real-time data streaming
- [ ] Device synchronization

### 9.2 Social Features
- [ ] Share achievements
- [ ] Compare with similar runners
- [ ] Group training sessions
- [ ] Leaderboards

### 9.3 AI Recommendations
- [ ] Machine learning from patterns
- [ ] Predictive cadence adjustments
- [ ] Injury prevention insights
- [ ] Personalized training suggestions

## Phase 10: Polish & Optimization

### 9.1 UI/UX Improvements
- [ ] Add animations and transitions
- [ ] Improve accessibility
- [ ] Dark mode support
- [ ] Onboarding flow

### 9.2 Performance
- [ ] Optimize FIT file parsing
- [ ] Reduce app size
- [ ] Improve battery efficiency
- [ ] Cache frequently used data

### 9.3 Testing
- [ ] Unit tests for calculations
- [ ] Integration tests for services
- [ ] E2E testing with Detox
- [ ] Beta testing with real users

## Phase 11: Launch Preparation

### 10.1 App Store Preparation
- [ ] Create app icons and splash screens
- [ ] Write app store descriptions
- [ ] Take screenshots for listings
- [ ] Prepare privacy policy

### 10.2 Build & Deploy
- [ ] Build iOS app with EAS
- [ ] Build Android app with EAS
- [ ] Submit to App Store
- [ ] Submit to Google Play

## Current Status

**Phase 1 Complete** - Ready to start Phase 2 (FIT File Analysis)

## Quick Start for Next Session

To continue development:

1. Open terminal in CadenceOptimizer directory
2. Run `npm install` (first time only)
3. Run `npm start` to launch dev server
4. Start with Phase 2.1 - implement FIT file parsing

## Key Dependencies to Add

```bash
# For FIT file parsing
npm install fit-file-parser

# For charts (Phase 7)
npm install react-native-chart-kit react-native-svg

# For advanced features (Phase 8)
npm install react-native-ble-plx
```
