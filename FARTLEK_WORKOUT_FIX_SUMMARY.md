# Fartlek Workout Fix Summary

## Issue
Fartlek workout mode was not working properly:
- Cadence was not changing during phase transitions
- No voice coaching or alert popups
- Progress bar and time remaining were stuck

## Root Cause
**Stale Closure Problem**: React callbacks were created once in `useEffect` with empty dependency array, capturing initial state values. When WorkoutEngine called these callbacks later, they had stale references to `isPlaying`, `handleBeat`, and other functions.

## Solution
Implemented **stable callback pattern using refs**:

### 1. Created refs to track current values
```javascript
const isPlayingRef = useRef(false);
const handleBeatRef = useRef(null);
const callbacksRef = useRef({
  onPhaseChange: null,
  onCadenceChange: null,
  onWorkoutComplete: null,
  onCoachingCue: null,
});
```

### 2. Updated refs when state changes
```javascript
useEffect(() => {
  isPlayingRef.current = isPlaying;
}, [isPlaying]);
```

### 3. Created stable wrapper functions
```javascript
const stableHandleBeat = (beatNumber) => {
  if (handleBeatRef.current) {
    handleBeatRef.current(beatNumber);
  }
};

const stableCallbacks = {
  onPhaseChange: (...args) => callbacksRef.current.onPhaseChange?.(...args),
  onCadenceChange: (...args) => callbacksRef.current.onCadenceChange?.(...args),
  onWorkoutComplete: (...args) => callbacksRef.current.onWorkoutComplete?.(...args),
  onCoachingCue: (...args) => callbacksRef.current.onCoachingCue?.(...args),
};
```

### 4. Used stable wrappers everywhere
- `MetronomeService.start(cadence, stableHandleBeat, ...)`
- `MetronomeService.updateBpm(newCadence, stableHandleBeat)`
- `WorkoutEngine.setCallbacks(stableCallbacks)`

## Build History

### Builds 1-6
- Initial releases with various UI fixes
- Build 6: Added 1-second interval to update workout status

### Build 7
- Fixed time remaining display (removed extra /1000 division)
- Fixed coaching voice service call (use speakCoachingCue)
- Added comprehensive [FARTLEK] debug logging

### Build 8
- Added mode detection debug logging
- Added visual alert to show current mode

### Build 9
- Added mode check alert popup for debugging
- Confirmed mode was correctly set to "fartlek"

### Build 10
- Fixed stale closure for `isPlaying` using ref
- Cadence changed once but not after first phase

### Build 11 ✅
- Fixed stale closure for `handleBeat` using stable callback ref
- **CONFIRMED WORKING**: Cadence now changes through all phases
- Metronome pace updates correctly during workout

### Build 12 (Previous test)
- Fixed stale closures for all WorkoutEngine callbacks
- **ISSUE FOUND**: Phases with no cadence change had 0 coaching cues
- Console showed: `[FARTLEK] Scheduling 0 coaching cues for phase`
- Root cause: `generateCoachingCues()` only created cues when `Math.abs(cadenceChange) > 5`

### Build 13 (Previous test)
- **Fixed coaching cue generation**: ALL phases now get coaching cues
  - Added fallback cue for phases with no cadence change: "Maintain X steps per minute. Stay focused."
  - Added `case 'base':` to intensity switch for base intensity phases
- **Fixed metronome beat consistency**: 
  - `updateBpm()` now smoothly transitions without stopping/restarting
  - Added guard to skip update if BPM hasn't changed
  - Prevents timing hiccups and beat counter resets
- **Optimized cadence change detection**:
  - `onCadenceChange` only called when cadence actually changes
  - Prevents unnecessary metronome updates
- Should now have voice coaching, alerts, AND smooth consistent beat

### Build 14 (Previous test)
- Added comprehensive diagnostic logging to identify exact failure points
- **ROOT CAUSES IDENTIFIED FROM LOGS**:
  1. `coachingEnabled: false` - Voice coaching turned OFF in UI
  2. `audioEnabled: false` - Audio turned OFF in UI  
  3. **Timing race condition**: `WorkoutEngine.startFartlek()` fires `onCadenceChange` BEFORE `setIsPlaying(true)` executes
  4. When `onCadenceChange` fires, `isPlayingRef.current` is still `false`
  5. Metronome BPM update is skipped because metronome "not playing"

### Build 15 (Ready to test) ✅
- **CRITICAL FIX: Fixed timing race condition**
  - Reordered operations in `toggleMetronome()`:
    1. `setIsPlaying(true)` - Set state FIRST
    2. `MetronomeService.start()` - Start metronome SECOND  
    3. `WorkoutEngine.startFartlek()` - Start workout LAST
  - Now when `onCadenceChange` fires, `isPlayingRef.current` is `true`
  - Metronome BPM updates will work correctly
- **Removed debug alert** - No more "Mode Check" popup
- **Removed extra debug logs** - Cleaned up console output
- **Confirmed defaults**: `audioEnabled: true`, `coachingEnabled: true`
- Should now have: ✅ Metronome beats ✅ Cadence changes ✅ Voice coaching ✅ Alerts

## Testing Results

### Build 11
✅ Metronome starts
✅ Workout status section appears
✅ Progress bar moves
✅ Time remaining counts down
✅ Cadence changes during phase transitions
✅ Phases advance correctly
❌ No voice coaching (fixed in build 12)
❌ No alert popups (fixed in build 12)

### Build 15 (WORKING!) ✅
✅ Metronome starts immediately
✅ Metronome beats are audible
✅ Workout status section appears
✅ Progress bar moves
✅ Time remaining counts down
✅ Phases advance correctly (tested through 4 phases)
✅ Voice coaching works - spoken cues are audible
✅ Alert popups appear with coaching messages
✅ Cadence changes when workout generates different cadence phases
✅ Audio enabled by default
✅ Coaching enabled by default

**Note**: Fartlek workouts are randomized. Not every phase changes cadence - this is expected behavior. The workout generator uses a 40% change frequency for intermediate difficulty, and some phases intentionally maintain the same cadence for recovery or base pace work.

## Next Steps

1. ✅ **Build 15 tested and working!**
2. **Continue testing** - Run through more Fartlek workouts to verify consistency
3. **Test other workout modes** - Interval and Progressive should also work now
4. **Optional cleanup** - Remove [FARTLEK] debug logs if desired (currently helpful for debugging)
5. **Production build** - Upload to TestFlight when Expo free tier resets (March 1, 2026)

## Status: RESOLVED ✅

The Fartlek workout feature is now fully functional:
- Metronome beats work correctly
- Cadence changes are applied when phases have different cadences
- Voice coaching speaks cues and shows alerts
- Progress tracking works properly
- All timing issues resolved

## Files Modified

- `src/screens/MetronomeScreen.js` - Main fixes for stale closures
- `src/services/WorkoutEngine.js` - Enhanced logging
- `src/services/CoachingVoiceService.js` - Enhanced logging
- `app.json` - Build number increments

## Key Learnings

1. **React closure gotcha**: Callbacks in `useEffect` with empty deps capture initial state
2. **Ref pattern**: Use refs + stable wrappers for callbacks that need current state
3. **Debugging strategy**: Visual alerts work better than console logs for mobile testing
4. **Incremental fixes**: Each build isolated one issue, making debugging easier
