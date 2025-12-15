// Metronome Service
// Handles audio metronome functionality with expo-av

import { Audio } from 'expo-av';

export class MetronomeService {
  constructor() {
    this.isPlaying = false;
    this.intervalId = null;
    this.currentBeat = 0;
    this.bpm = 170;
    this.soundType = 'click';
    this.volume = 0.8;
    this.audioEnabled = true;
    this.sounds = {};
    this.isInitialized = false;
  }

  /**
   * Initialize audio system and load sounds
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Set audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create audio objects for different sound types
      await this.loadSounds();
      this.isInitialized = true;
      console.log('MetronomeService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MetronomeService:', error);
    }
  }

  /**
   * Load metronome sounds
   */
  async loadSounds() {
    try {
      // Create different metronome sounds using Audio.Sound
      const soundConfigs = {
        click: { frequency: 800, duration: 100 },
        beep: { frequency: 1000, duration: 150 },
        tick: { frequency: 600, duration: 80 },
        wood: { frequency: 400, duration: 120 },
      };

      // For now, we'll use a simple beep sound
      // In a real app, you'd load actual audio files
      this.sounds = {
        normal: await Audio.Sound.createAsync(
          { uri: this.generateBeepDataUri(800, 100) },
          { volume: this.volume }
        ),
        accent: await Audio.Sound.createAsync(
          { uri: this.generateBeepDataUri(1200, 150) },
          { volume: this.volume }
        ),
      };
    } catch (error) {
      console.error('Failed to load sounds:', error);
    }
  }

  /**
   * Generate a simple beep sound as data URI
   * @param {number} frequency - Frequency in Hz
   * @param {number} duration - Duration in ms
   * @returns {string} Data URI for the sound
   */
  generateBeepDataUri(frequency, duration) {
    // This is a simplified approach - in production you'd use actual audio files
    // For now, we'll use a placeholder that works with expo-av
    return 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
  }

  /**
   * Start the metronome
   * @param {number} bpm - Beats per minute (cadence)
   * @param {Function} onBeat - Callback function called on each beat
   */
  async start(bpm, onBeat) {
    if (this.isPlaying) return;

    await this.initialize();

    this.bpm = bpm;
    this.isPlaying = true;
    this.currentBeat = 0;

    const interval = (60 / bpm) * 1000; // Convert BPM to milliseconds

    this.intervalId = setInterval(async () => {
      this.currentBeat++;
      const isAccent = this.currentBeat % 4 === 0;
      
      if (onBeat) {
        onBeat(this.currentBeat, isAccent);
      }
      
      if (this.audioEnabled) {
        await this.playSound(isAccent);
      }
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
   * @param {Function} onBeat - Beat callback
   */
  async updateBpm(newBpm, onBeat) {
    if (this.isPlaying) {
      this.stop();
      await this.start(newBpm, onBeat);
    }
    this.bpm = newBpm;
  }

  /**
   * Play metronome sound
   * @param {boolean} isAccent - Whether this is an accented beat
   */
  async playSound(isAccent) {
    try {
      if (!this.isInitialized || !this.audioEnabled) return;

      const soundKey = isAccent ? 'accent' : 'normal';
      const sound = this.sounds[soundKey];

      if (sound && sound.sound) {
        // Reset position and play
        await sound.sound.setPositionAsync(0);
        await sound.sound.playAsync();
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  /**
   * Set volume
   * @param {number} volume - Volume level (0-1)
   */
  async setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    
    try {
      if (this.sounds.normal && this.sounds.normal.sound) {
        await this.sounds.normal.sound.setVolumeAsync(this.volume);
      }
      if (this.sounds.accent && this.sounds.accent.sound) {
        await this.sounds.accent.sound.setVolumeAsync(this.volume);
      }
    } catch (error) {
      console.error('Error setting volume:', error);
    }
  }

  /**
   * Toggle audio on/off
   * @param {boolean} enabled - Whether audio is enabled
   */
  setAudioEnabled(enabled) {
    this.audioEnabled = enabled;
  }

  /**
   * Set sound type
   * @param {string} type - Sound type (click, beep, tick, wood)
   */
  setSoundType(type) {
    this.soundType = type;
    // In a full implementation, this would switch between different sound files
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
      soundType: this.soundType,
      volume: this.volume,
      audioEnabled: this.audioEnabled,
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    this.stop();
    
    try {
      if (this.sounds.normal && this.sounds.normal.sound) {
        await this.sounds.normal.sound.unloadAsync();
      }
      if (this.sounds.accent && this.sounds.accent.sound) {
        await this.sounds.accent.sound.unloadAsync();
      }
    } catch (error) {
      console.error('Error cleaning up sounds:', error);
    }
    
    this.isInitialized = false;
  }
}

// Singleton instance
export default new MetronomeService();
