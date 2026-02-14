# Local Development Build Guide - Build 12 Testing

## Overview
This guide walks you through building and testing Build 12 locally on your device to test the voice coaching and alert popup fixes for Fartlek workouts.

## What You're Testing
Build 12 includes fixes for:
- ✅ Voice coaching during Fartlek workouts
- ✅ Alert popups for coaching cues
- ✅ All WorkoutEngine callbacks using stable wrapper pattern

## Prerequisites
✅ Xcode 26.2 installed
✅ Expo CLI installed
✅ iPhone connected via USB or iOS Simulator running

---

## Step-by-Step Instructions

### Step 1: Connect Your Device

**Option A: Physical iPhone**
1. Connect your iPhone to your Mac via USB cable
2. Unlock your iPhone
3. If prompted, tap "Trust This Computer" on your iPhone
4. Enter your iPhone passcode

**Option B: iOS Simulator**
1. Open Xcode
2. Go to Xcode → Open Developer Tool → Simulator
3. Choose your preferred iPhone model (e.g., iPhone 15 Pro)

### Step 2: Verify Device Connection

Run this command to see available devices:
```bash
xcrun simctl list devices available
```

For physical device, check it appears in:
```bash
xcrun xctrace list devices
```

### Step 3: Clean Previous Builds (Optional but Recommended)

```bash
# Clean iOS build folder
rm -rf ios/build

# Clean Expo cache
npx expo start --clear
```

### Step 4: Install Dependencies

Make sure all dependencies are up to date:
```bash
npm install
```

### Step 5: Pre-build iOS Native Project

This generates the native iOS project:
```bash
npx expo prebuild --platform ios
```

**What this does:**
- Creates/updates the `ios/` folder with native Xcode project
- Configures all native modules (expo-speech, expo-location, etc.)
- Sets up app permissions and entitlements

**Expected output:** You should see "iOS project configured" message

### Step 6: Build and Install on Device

Now run the actual build:

**For Physical iPhone:**
```bash
npx expo run:ios --device
```

**For iOS Simulator:**
```bash
npx expo run:ios
```

**What happens:**
1. Xcode builds the native iOS app (5-10 minutes first time)
2. App automatically installs on your device/simulator
3. Metro bundler starts and serves JavaScript
4. App launches automatically

**Expected output:**
```
› Building iOS app...
› Launching on iPhone...
› Opening on iPhone...
```

### Step 7: Testing Checklist

Once the app launches, test the following:

#### Basic Functionality
- [ ] App launches successfully
- [ ] Navigate to Metronome screen
- [ ] Select "FARTLEK" mode
- [ ] Set difficulty to "INTERMEDIATE"
- [ ] Ensure "VOICE COACHING ON" is enabled

#### Fartlek Workout Test
1. **Start Workout**
   - [ ] Tap START button
   - [ ] Dismiss the "Mode Check" alert (this is debug code, we'll remove it later)
   - [ ] Metronome starts playing

2. **Phase Changes** (wait for first phase transition, usually 30-60 seconds)
   - [ ] Cadence changes on screen
   - [ ] Metronome tempo changes
   - [ ] Progress bar moves
   - [ ] Time remaining counts down

3. **Voice Coaching** (THIS IS THE KEY TEST)
   - [ ] You HEAR voice coaching through your device speaker
   - [ ] You SEE alert popups with coaching messages
   - [ ] Messages like "Speed play! Pick it up to XXX steps per minute"
   - [ ] Mid-phase cues like "Quick light steps! You've got this!"

4. **Multiple Phases**
   - [ ] Let workout run through 2-3 phase changes
   - [ ] Verify voice coaching works for each phase
   - [ ] Verify alerts appear for each phase

#### What Success Looks Like
✅ Voice speaks coaching cues out loud
✅ Alert popups appear with coaching messages
✅ Cadence changes smoothly between phases
✅ Progress bar and timer work correctly

#### What to Watch For
❌ No voice (only visual alerts) = voice service issue
❌ No alerts at all = callback issue (shouldn't happen with Build 12)
❌ Cadence doesn't change = metronome update issue (fixed in Build 11)

### Step 8: Check Console Logs

While testing, watch the Metro bundler console for debug logs:

Look for these key messages:
```
[FARTLEK] Starting phase X/Y
[FARTLEK] Calling onCadenceChange callback with cadence XXX
[FARTLEK] Scheduling X coaching cues for phase
[FARTLEK] Firing coaching cue: "message" (type)
[FARTLEK] Speaking coaching cue: "message" (type)
[FARTLEK] Calling expo-speech speak()
```

### Step 9: Troubleshooting

#### Build Fails
```bash
# Clean everything and try again
rm -rf ios/build
rm -rf node_modules
npm install
npx expo prebuild --platform ios --clean
npx expo run:ios
```

#### App Crashes on Launch
- Check Metro bundler console for JavaScript errors
- Try restarting Metro: Press `r` in the terminal

#### No Voice Coaching
1. Check device volume is up
2. Check device is not in silent mode (flip switch on side)
3. Check console logs for "[FARTLEK] Speaking coaching cue" messages
4. If you see the logs but no voice, it's an expo-speech issue

#### Metro Bundler Won't Start
```bash
# Kill any existing Metro processes
pkill -f "react-native"
pkill -f "metro"

# Start fresh
npx expo start --clear
```

### Step 10: After Testing

Once you confirm everything works:

1. **Report Results**
   - Note what works and what doesn't
   - Share any console errors
   - Confirm voice coaching is working

2. **Next Steps**
   - Remove the debug "Mode Check" alert
   - Clean up [FARTLEK] debug logs (optional)
   - Wait for Expo free tier reset (March 1) to build for TestFlight

---

## Quick Reference Commands

```bash
# Build and run on physical device
npx expo run:ios --device

# Build and run on simulator
npx expo run:ios

# Clean and rebuild
rm -rf ios/build && npx expo run:ios

# View available devices
xcrun simctl list devices available

# Stop Metro bundler
Press Ctrl+C in terminal

# Restart Metro bundler
Press 'r' in terminal
```

---

## Important Notes

### Development Build vs Production Build
- **Development build** (what you're doing now):
  - Fast to build and test
  - Only works on your device
  - Includes debug tools
  - Can't share via TestFlight

- **Production build** (EAS build):
  - Takes longer (cloud build)
  - Can distribute via TestFlight
  - Optimized and minified
  - What you'll do after testing succeeds

### Why This Works
The stable callback pattern in Build 12 ensures:
1. `callbacksRef.current` always points to latest callback functions
2. `stableCallbacks` wrappers never change reference
3. WorkoutEngine can call callbacks and get current state
4. Voice coaching and alerts work because callbacks aren't stale

### What's Different from Build 11
- Build 11: Only `isPlaying` and `handleBeat` used refs
- Build 12: ALL WorkoutEngine callbacks use stable wrapper pattern
- This enables `onCoachingCue` callback to work properly

---

## Expected Timeline

- **Step 1-5:** 2-3 minutes (setup)
- **Step 6:** 5-10 minutes (first build)
- **Step 7:** 5-10 minutes (testing)
- **Total:** ~15-20 minutes

Subsequent builds are faster (1-2 minutes) since Xcode caches most files.

---

## Success Criteria

You'll know Build 12 is working when:
1. ✅ You hear voice coaching through device speaker
2. ✅ You see alert popups with coaching messages  
3. ✅ Cadence changes smoothly between phases
4. ✅ Console shows "[FARTLEK] Firing coaching cue" messages

If all 4 are working, Build 12 is ready for production!

---

## Need Help?

If you run into issues:
1. Check the Troubleshooting section above
2. Share the console error messages
3. Note which step failed
4. Check if it's a build error or runtime error
