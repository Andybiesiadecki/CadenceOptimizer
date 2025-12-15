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
      // Use Web Audio API for web, simple approach for mobile
      if (typeof window !== 'undefined' && window.AudioContext) {
        // Web platform - use Web Audio API
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {
          normal: { frequency: 800, duration: 0.1 },
          accent: { frequency: 1200, duration: 0.15 },
        };
      } else {
        // Mobile platform - we'll use a different approach
        console.log('Mobile platform detected - using alternative audio method');
        this.sounds = {
          normal: { frequency: 800, duration: 0.1 },
          accent: { frequency: 1200, duration: 0.15 },
        };
      }
    } catch (error) {
      console.error('Failed to load sounds:', error);
    }
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
      const soundConfig = this.sounds[soundKey];

      if (this.audioContext) {
        // Web Audio API approach
        this.playWebAudioBeep(soundConfig.frequency, soundConfig.duration);
      } else {
        // Mobile approach - use console for now, will implement native audio later
        console.log(isAccent ? 'TICK (accent)' : 'tick');
        
        // Try to use device vibration as feedback on mobile
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(isAccent ? 100 : 50);
        }
      }
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }

  /**
   * Play beep using Web Audio API
   * @param {number} frequency - Frequency in Hz
   * @param {number} duration - Duration in seconds
   */
  playWebAudioBeep(frequency, duration) {
    try {
      if (!this.audioContext) return;

      // Create oscillator
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configure oscillator
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      oscillator.type = 'sine';

      // Configure gain (volume envelope)
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, this.audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

      // Play sound
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (error) {
      console.error('Error playing web audio beep:', error);
    }
  }

  /**
   * Set volume
   * @param {number} volume - Volume level (0-1)
   */
  async setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    // Volume is now handled in the playWebAudioBeep method
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
      if (this.audioContext) {
        await this.audioContext.close();
        this.audioContext = null;
      }
    } catch (error) {
      console.error('Error cleaning up audio context:', error);
    }
    
    this.isInitialized = false;
  }
}

// Singleton instance
export default new MetronomeService();
