// Tests for WorkoutEngine phase/cue timing (F2). The engine is load-bearing:
// a single 250ms wall-clock tick derives "what phase/cue should be active for
// the elapsed time", so it survives iOS suspending timers when the screen is
// locked. These tests drive the REAL engine with jest's modern fake timers
// (which fake both setInterval and Date.now — the engine's whole clock).
//
// The two RN-coupled imports (utils/storage -> AsyncStorage, TerrainDetector
// -> expo-location) are only used in workout *generation* / terrain
// adjustment, so they are stubbed; timing logic under test is untouched.

jest.mock('../../utils/storage', () => ({
  getRunnerProfile: jest.fn(async () => ({})),
}));

jest.mock('../TerrainDetector', () => ({
  __esModule: true,
  default: { currentTerrain: null },
}));

import { WorkoutEngine } from '../WorkoutEngine';

const TICK_MS = 250; // must match WORKOUT_TICK_MS in WorkoutEngine.js

// Hand-built 3-phase workout (10s / 20s / 10s) with deterministic cues:
// phase 0 has a start cue (timing 0, fires immediately) and a mid cue at 50%.
const makeWorkout = () => ({
  id: 'test_workout',
  name: 'Test Workout',
  type: 'interval',
  duration: 40,
  phases: [
    {
      id: 0,
      cadence: 160,
      duration: 10,
      intensity: 'warmup',
      type: 'interval',
      coachingCues: [
        { timing: 0, message: 'start cue', type: 'instruction' },
        { timing: 0.5, message: 'phase0 mid cue', type: 'guidance' },
      ],
    },
    {
      id: 1,
      cadence: 175,
      duration: 20,
      intensity: 'work',
      type: 'interval',
      coachingCues: [{ timing: 0.8, message: 'phase1 late cue', type: 'motivation' }],
    },
    {
      id: 2,
      cadence: 160,
      duration: 10,
      intensity: 'cooldown',
      type: 'interval',
      coachingCues: [],
    },
  ],
});

describe('WorkoutEngine timing (fake clock)', () => {
  let engine;
  let onPhaseChange;
  let onCadenceChange;
  let onWorkoutComplete;
  let onCoachingCue;
  let cueMessages;

  const start = async (workout = makeWorkout()) => {
    engine.setCallbacks({ onPhaseChange, onCadenceChange, onWorkoutComplete, onCoachingCue });
    await engine.startWorkout(workout);
    return workout;
  };

  const firedCount = (message) => cueMessages.filter((m) => m === message).length;

  beforeEach(() => {
    jest.useFakeTimers();
    engine = new WorkoutEngine();
    cueMessages = [];
    onPhaseChange = jest.fn();
    onCadenceChange = jest.fn();
    onWorkoutComplete = jest.fn();
    onCoachingCue = jest.fn((message) => cueMessages.push(message));
  });

  afterEach(() => {
    if (engine.isActive) engine.stopWorkout();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe('phase advancement', () => {
    test('phases advance in order at their scheduled times', async () => {
      await start();

      expect(engine.currentPhase).toBe(0);
      expect(onPhaseChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: 0 }), 0, 3);

      // One tick before the 10s boundary: still phase 0.
      jest.advanceTimersByTime(10000 - TICK_MS);
      expect(engine.currentPhase).toBe(0);

      // The tick AT the boundary advances to phase 1.
      jest.advanceTimersByTime(TICK_MS);
      expect(engine.currentPhase).toBe(1);
      expect(onPhaseChange).toHaveBeenLastCalledWith(expect.objectContaining({ id: 1 }), 1, 3);

      // Phase 1 runs its full 20s from its own start.
      jest.advanceTimersByTime(20000 - TICK_MS);
      expect(engine.currentPhase).toBe(1);
      jest.advanceTimersByTime(TICK_MS);
      expect(engine.currentPhase).toBe(2);

      // Phase indexes were visited strictly in order 0, 1, 2.
      expect(onPhaseChange.mock.calls.map((c) => c[1])).toEqual([0, 1, 2]);
    });

    test('cadence change fires for the first phase and on every cadence transition', async () => {
      await start();

      // First phase always announces its cadence.
      expect(onCadenceChange).toHaveBeenCalledTimes(1);
      expect(onCadenceChange).toHaveBeenLastCalledWith(160, 160);

      jest.advanceTimersByTime(10000); // -> phase 1 (160 -> 175)
      expect(onCadenceChange).toHaveBeenLastCalledWith(175, 175);
      jest.advanceTimersByTime(20000); // -> phase 2 (175 -> 160)
      expect(onCadenceChange).toHaveBeenLastCalledWith(160, 160);
      expect(onCadenceChange).toHaveBeenCalledTimes(3);
    });

    test('running past the final phase completes the workout exactly once', async () => {
      const workout = await start();

      jest.advanceTimersByTime(40000); // 10 + 20 + 10 seconds
      expect(onWorkoutComplete).toHaveBeenCalledTimes(1);
      const [completedWorkout, stats, completed] = onWorkoutComplete.mock.calls[0];
      expect(completedWorkout).toBe(workout);
      expect(completed).toBe(true);
      expect(stats.phasesCompleted).toBe(3);
      expect(engine.isActive).toBe(false);

      // The tick is stopped: more time causes no further callbacks.
      jest.advanceTimersByTime(60000);
      expect(onWorkoutComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('coaching cues', () => {
    test('each cue fires exactly once, at its scheduled fraction of the phase', async () => {
      await start();

      // timing-0 cue fires immediately on phase start.
      expect(firedCount('start cue')).toBe(1);
      expect(firedCount('phase0 mid cue')).toBe(0);

      // Mid cue (50% of 10s = 5s) has not fired one tick early…
      jest.advanceTimersByTime(5000 - TICK_MS);
      expect(firedCount('phase0 mid cue')).toBe(0);
      // …fires at 5s…
      jest.advanceTimersByTime(TICK_MS);
      expect(firedCount('phase0 mid cue')).toBe(1);
      // …and never re-fires on later ticks of the same phase.
      jest.advanceTimersByTime(4000);
      expect(firedCount('phase0 mid cue')).toBe(1);

      // Phase 1 late cue (80% of 20s = 16s into phase 1, t = 26s overall).
      jest.advanceTimersByTime(1000 + 16000 - TICK_MS);
      expect(firedCount('phase1 late cue')).toBe(0);
      jest.advanceTimersByTime(TICK_MS);
      expect(firedCount('phase1 late cue')).toBe(1);

      // Run to the end: totals unchanged — every cue fired exactly once.
      jest.advanceTimersByTime(20000);
      expect(firedCount('start cue')).toBe(1);
      expect(firedCount('phase0 mid cue')).toBe(1);
      expect(firedCount('phase1 late cue')).toBe(1);
    });
  });

  describe('pause / resume', () => {
    test('pause freezes phase progress and cues; resume continues where it left off', async () => {
      await start();

      jest.advanceTimersByTime(4000); // 4s into phase 0 (mid cue at 5s not yet due)
      expect(firedCount('phase0 mid cue')).toBe(0);

      engine.pauseWorkout();
      const pausedRemaining = engine.getStatus().phaseTimeRemaining;
      expect(pausedRemaining).toBeCloseTo(6, 1);

      // A long pause: nothing advances, nothing fires, remaining time is frozen.
      jest.advanceTimersByTime(60000);
      expect(engine.currentPhase).toBe(0);
      expect(firedCount('phase0 mid cue')).toBe(0);
      expect(engine.getStatus().phaseTimeRemaining).toBeCloseTo(pausedRemaining, 1);

      engine.resumeWorkout();

      // 1s after resume (5s of phase time) the mid cue fires.
      jest.advanceTimersByTime(1000);
      expect(firedCount('phase0 mid cue')).toBe(1);
      expect(engine.currentPhase).toBe(0);

      // Phase 0 still gets its remaining 5s before advancing.
      jest.advanceTimersByTime(5000 - TICK_MS);
      expect(engine.currentPhase).toBe(0);
      jest.advanceTimersByTime(TICK_MS);
      expect(engine.currentPhase).toBe(1);
    });

    test('double pause / resume calls are no-ops', async () => {
      await start();

      jest.advanceTimersByTime(2000);
      engine.pauseWorkout();
      const remaining = engine.getStatus().phaseTimeRemaining;

      jest.advanceTimersByTime(10000);
      engine.pauseWorkout(); // second pause while paused must not re-snapshot
      expect(engine.getStatus().phaseTimeRemaining).toBeCloseTo(remaining, 1);

      engine.resumeWorkout();
      engine.resumeWorkout(); // second resume must not shift the clock again
      jest.advanceTimersByTime(8000 - TICK_MS);
      expect(engine.currentPhase).toBe(0);
      jest.advanceTimersByTime(TICK_MS);
      expect(engine.currentPhase).toBe(1);
    });
  });

  describe('missed / late ticks (iOS backgrounding — F2)', () => {
    test('a late tick after a long suspension advances exactly ONE phase, never skips', async () => {
      await start();
      expect(engine.currentPhase).toBe(0);

      // Simulate iOS suspending the JS timers: wall-clock jumps 35s (past the
      // end of phase 0 AND all of phase 1) with NO intervening ticks, then a
      // single tick fires.
      jest.setSystemTime(Date.now() + 35000);
      jest.advanceTimersByTime(TICK_MS);

      // Exactly one transition: 0 -> 1. Phase 1 was NOT skipped.
      expect(engine.currentPhase).toBe(1);
      expect(onPhaseChange.mock.calls.map((c) => c[1])).toEqual([0, 1]);

      // The catch-up tick also fired phase 0's overdue cue — exactly once.
      expect(firedCount('phase0 mid cue')).toBe(1);

      // Phase 1 restarts its clock from the late tick: full 20s before phase 2.
      jest.advanceTimersByTime(20000 - TICK_MS);
      expect(engine.currentPhase).toBe(1);
      jest.advanceTimersByTime(TICK_MS);
      expect(engine.currentPhase).toBe(2);
    });
  });

  describe('stop', () => {
    test('stopWorkout reports an incomplete workout and halts the tick', async () => {
      await start();

      jest.advanceTimersByTime(12000); // into phase 1
      engine.stopWorkout();

      expect(onWorkoutComplete).toHaveBeenCalledTimes(1);
      expect(onWorkoutComplete.mock.calls[0][2]).toBe(false); // not completed
      expect(engine.isActive).toBe(false);

      jest.advanceTimersByTime(60000);
      expect(onPhaseChange.mock.calls.map((c) => c[1])).toEqual([0, 1]);
      expect(onWorkoutComplete).toHaveBeenCalledTimes(1);
    });
  });
});
