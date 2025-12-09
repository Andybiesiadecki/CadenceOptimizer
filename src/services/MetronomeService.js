// Metronome Service
// Handles audio metronome functionality

export class MetronomeService {
  constructor() {
    this.isPlaying = false;
    this.intervalId = null;
    this.currentBeat = 0;
    this.bpm = 170;
  }

  /**
   * Start the metronome
   * @param {number} bpm - Beats per minute (cadence)
   * @param {Function} onBeat - Callback function called on each beat
   */
  start(bpm, onBeat) {
    if (this.isPlaying) return;

    this.bpm = bpm;
    this.isPlaying = true;
    this.currentBeat = 0;

    const interval = (60 / bpm) * 1000; // Convert BPM to milliseconds

    this.intervalId = setInterval(() => {
      this.currentBeat++;
      if (onBeat) {
        onBeat(this.currentBeat);
      }
      this.playSound(this.currentBeat % 4 === 0); // Accent every 4th beat
    }, interval);
  }

  /**
   * Stop the metronome
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isPlaying = false;
    this.currentBeat = 0;
  }

  /**
   * Update BPM while playing
   * @param {number} newBpm - New beats per minute
   */
  updateBpm(newBpm) {
    if (this.isPlaying) {
      this.stop();
      this.start(newBpm);
    }
    this.bpm = newBpm;
  }

  /**
   * Play metronome sound
   * @param {boolean} isAccent - Whether this is an accented beat
   */
  async playSound(isAccent) {
    // TODO: Implement actual audio playback using expo-av
    // For now, this is a placeholder
    console.log(isAccent ? 'TICK' : 'tick');
  }

  /**
   * Get current state
   * @returns {Object} Current metronome state
   */
  getState() {
    return {
      isPlaying: this.isPlaying,
      bpm: this.bpm,
      currentBeat: this.currentBeat,
    };
  }
}

// Singleton instance
export default new MetronomeService();
