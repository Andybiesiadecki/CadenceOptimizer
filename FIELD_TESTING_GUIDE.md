# 🏃‍♂️ Field Testing Guide - STRDR Real Running Tests

## 📱 Testing Options (Easiest to Most Advanced)

### Option 1: Expo Go (Quickest - 2 minutes)
**Best for: Initial testing, basic features**

```bash
# Make sure dev server is running
npm start

# On your phone:
# 1. Install Expo Go from App Store/Play Store
# 2. Scan QR code from terminal
# 3. App loads instantly on your phone
```

**Limitations:**
- Some native features may not work perfectly
- GPS might be limited
- Audio might have restrictions

### Option 2: Development Build (Recommended - 10 minutes)
**Best for: Full feature testing, real running conditions**

```bash
# Install EAS CLI
npm install -g @expo/eas-cli
eas login

# Create development build
eas build --profile development --platform ios
# or
eas build --profile development --platform android

# Install the build on your phone when complete
```

**Advantages:**
- All native features work perfectly
- Real GPS and audio functionality
- Identical to production app

### Option 3: Preview Build (Production-like - 15 minutes)
**Best for: Final testing before app store submission**

```bash
# Create preview build (like production but installable)
eas build --profile preview --platform ios
# or  
eas build --profile preview --platform android
```

## 🏃‍♂️ Real Running Test Scenarios

### Test 1: Basic Metronome Run (5-10 minutes)
**Goal:** Test core metronome functionality during actual running

**Setup:**
1. Open app on phone
2. Go to Metronome tab
3. Set cadence to 170 SPM
4. Start audio metronome
5. Put phone in pocket/armband

**Test During Run:**
- [ ] Audio plays clearly through headphones
- [ ] Beat timing feels consistent
- [ ] Volume is appropriate for outdoor use
- [ ] App doesn't crash or stop audio
- [ ] Battery usage is reasonable

**Expected Results:**
- Clear, consistent audio beats
- No audio dropouts or glitches
- App remains responsive

### Test 2: GPS Terrain Detection (15-20 minutes)
**Goal:** Test GPS features and terrain-adaptive cadence

**Setup:**
1. Find a route with hills/elevation changes
2. Enable location permissions
3. Go to Metronome tab
4. Select "Terrain Mode"
5. Set base cadence (e.g., 170 SPM)

**Test During Run:**
- [ ] GPS acquires location quickly
- [ ] Terrain detection shows uphill/downhill/flat
- [ ] Cadence adjusts automatically on hills
- [ ] Grade percentage displays accurately
- [ ] Confidence indicator shows GPS quality

**Expected Results:**
- Uphill: +5-10 SPM increase
- Downhill: -3-8 SPM decrease
- Flat: No adjustment
- Real-time terrain feedback

### Test 3: Advanced Workout Modes (20-30 minutes)
**Goal:** Test Fartlek, Interval, and Progressive modes

**Fartlek Test:**
1. Select Fartlek mode
2. Choose difficulty level
3. Start workout
4. Follow voice coaching cues

**Test During Run:**
- [ ] Voice coaching is clear and audible
- [ ] Cadence changes match workout phases
- [ ] Phase transitions are smooth
- [ ] Workout progress is tracked correctly
- [ ] Completion notification works

### Test 4: Background Operation (30+ minutes)
**Goal:** Test app behavior during long runs

**Setup:**
1. Start metronome or workout
2. Switch to other apps (music, messages)
3. Lock phone screen
4. Continue running

**Test During Run:**
- [ ] Audio continues in background
- [ ] GPS tracking continues
- [ ] Voice coaching still works
- [ ] App doesn't get killed by system
- [ ] Battery usage is acceptable

## 📊 Post-Run Testing

### Test 5: FIT File Analysis
**Goal:** Test analysis features with real data

**Setup:**
1. Upload a real FIT file from your GPS watch
2. Or use the test data feature

**Test Features:**
- [ ] File uploads successfully
- [ ] ZIP files extract properly
- [ ] Analysis completes without errors
- [ ] Charts display correctly
- [ ] Recommendations are relevant
- [ ] Data exports properly

### Test 6: Profile Integration
**Goal:** Test personalized recommendations

**Setup:**
1. Complete runner profile setup
2. Upload FIT file or use test data
3. Check recommendations

**Verify:**
- [ ] Profile data influences recommendations
- [ ] Cadence zones match your fitness level
- [ ] Goals are reflected in suggestions
- [ ] Experience level affects advice

## 🔧 Technical Testing

### Performance Tests
```bash
# Monitor performance during testing
# Check these metrics:
```

**Battery Usage:**
- [ ] <10% battery drain per hour of use
- [ ] No excessive heating
- [ ] Reasonable CPU usage

**Memory Usage:**
- [ ] No memory leaks during long sessions
- [ ] App doesn't crash after extended use
- [ ] Smooth performance throughout

**Network Usage:**
- [ ] Minimal data usage (app works offline)
- [ ] No unnecessary network requests
- [ ] GPS works without internet

### Edge Case Testing

**Low Battery:**
- [ ] App handles low battery gracefully
- [ ] Audio continues until battery dies
- [ ] Data is saved before shutdown

**Poor GPS Signal:**
- [ ] App handles GPS loss gracefully
- [ ] Falls back to basic metronome mode
- [ ] Recovers when GPS returns

**Interruptions:**
- [ ] Phone calls don't crash app
- [ ] Notifications don't interfere
- [ ] Music apps can run simultaneously

## 📝 Testing Checklist

### Pre-Run Setup
- [ ] Phone fully charged
- [ ] Headphones connected and tested
- [ ] Location permissions granted
- [ ] Audio permissions granted
- [ ] Test route planned (with elevation changes)

### During Run Tests
- [ ] Basic metronome (5 min)
- [ ] GPS terrain detection (10 min)
- [ ] Voice coaching (5 min)
- [ ] Background operation (entire run)
- [ ] App switching test
- [ ] Screen lock test

### Post-Run Analysis
- [ ] Data was saved correctly
- [ ] FIT file upload works
- [ ] Analysis features function
- [ ] Charts display properly
- [ ] Recommendations are relevant

### Multi-Device Testing
- [ ] Test on iPhone (if available)
- [ ] Test on Android (if available)
- [ ] Test on different screen sizes
- [ ] Test with different headphone types

## 🚨 Common Issues to Watch For

### Audio Problems
- **Symptom:** Audio cuts out or is choppy
- **Cause:** Background app restrictions
- **Fix:** Check background app permissions

### GPS Issues
- **Symptom:** Location not updating
- **Cause:** Location permissions or poor signal
- **Fix:** Test in open area, check permissions

### Battery Drain
- **Symptom:** Excessive battery usage
- **Cause:** GPS polling too frequently
- **Fix:** Optimize location update intervals

### App Crashes
- **Symptom:** App closes unexpectedly
- **Cause:** Memory issues or unhandled errors
- **Fix:** Check error logs, optimize memory usage

## 📊 Test Results Template

### Run Details
- **Date:** [Date]
- **Duration:** [Minutes]
- **Distance:** [Miles/KM]
- **Route:** [Description]
- **Device:** [Phone model]

### Feature Test Results
- **Metronome:** ✅/❌ [Notes]
- **GPS Terrain:** ✅/❌ [Notes]
- **Voice Coaching:** ✅/❌ [Notes]
- **Background Audio:** ✅/❌ [Notes]
- **Battery Usage:** [Percentage used]

### Issues Found
1. [Issue description]
2. [Issue description]
3. [Issue description]

### Overall Rating
- **Functionality:** [1-10]
- **Performance:** [1-10]
- **User Experience:** [1-10]
- **Ready for App Store:** ✅/❌

## 🎯 Success Criteria

**Ready for App Store if:**
- [ ] All core features work during real runs
- [ ] No crashes during 30+ minute sessions
- [ ] Battery usage <15% per hour
- [ ] Audio is clear and consistent
- [ ] GPS features work accurately
- [ ] Background operation is stable

**Need More Work if:**
- [ ] Frequent crashes or audio issues
- [ ] Excessive battery drain (>20% per hour)
- [ ] GPS features are unreliable
- [ ] Poor user experience during runs

---

## 🚀 Quick Start Testing

**Want to test right now?**

1. **Start dev server:** `npm start`
2. **Install Expo Go** on your phone
3. **Scan QR code** to load app
4. **Go for a 10-minute run** with metronome
5. **Test basic features** and report back!

The app is designed to work great for real running - let's make sure it does! 🏃‍♂️