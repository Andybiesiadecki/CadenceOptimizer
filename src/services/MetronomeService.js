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
      if (typeof window !== 'undefined' && window.AudioContext) {
        // Web platform - use Web Audio API
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {
          normal: { frequency: 800, duration: 0.1 },
          accent: { frequency: 1200, duration: 0.15 },
        };
        this.platform = 'web';
      } else {
        // Mobile platform - use expo-av
        console.log('Mobile platform detected - loading expo-av sounds');
        await this.loadMobileSounds();
        this.platform = 'mobile';
      }
    } catch (error) {
      console.error('Failed to load sounds:', error);
    }
  }

  /**
   * Load sounds for mobile using expo-av
   */
  async loadMobileSounds() {
    try {
      // Create simple beep sounds using expo-av
      const normalSound = new Audio.Sound();
      const accentSound = new Audio.Sound();

      // Load simple beep sounds (we'll create them programmatically)
      await normalSound.loadAsync({
        uri: this.createBeepDataUri(800, 100), // 800Hz, 100ms
      });

      await accentSound.loadAsync({
        uri: this.createBeepDataUri(1200, 150), // 1200Hz, 150ms
      });

      // Set initial volume
      await normalSound.setVolumeAsync(this.volume);
      await accentSound.setVolumeAsync(this.volume);

      this.sounds = {
        normal: normalSound,
        accent: accentSound,
      };

      console.log('Mobile sounds loaded successfully');
    } catch (error) {
      console.error('Failed to load mobile sounds:', error);
      // Fallback to simple approach
      this.sounds = {
        normal: null,
        accent: null,
      };
    }
  }

  /**
   * Create a simple beep sound as data URI for mobile
   */
  createBeepDataUri(frequency, duration) {
    // Create a simple WAV file data URI
    const sampleRate = 44100;
    const samples = Math.floor(sampleRate * duration / 1000);
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);

    // Generate sine wave
    for (let i = 0; i < samples; i++) {
      const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
      const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
      view.setInt16(44 + i * 2, intSample, true);
    }

    // Convert to base64
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return 'data:audio/wav;base64,' + btoa(binary);
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

      if (this.platform === 'web' && this.audioContext) {
        // Web Audio API approach
        const soundConfig = this.sounds[isAccent ? 'accent' : 'normal'];
        this.playWebAudioBeep(soundConfig.frequency, soundConfig.duration);
      } else if (this.platform === 'mobile') {
        // Mobile expo-av approach
        const sound = this.sounds[isAccent ? 'accent' : 'normal'];
        if (sound) {
          try {
            await sound.setPositionAsync(0);
            await sound.playAsync();
          } catch (playError) {
            console.log('Sound play error, using fallback:', playError.message);
            // Fallback to vibration
            this.playFallbackFeedback(isAccent);
          }
        } else {
          // No sound available, use fallback
          this.playFallbackFeedback(isAccent);
        }
      } else {
        // Fallback for any other case
        this.playFallbackFeedback(isAccent);
      }
    } catch (error) {
      console.error('Error playing sound:', error);
      this.playFallbackFeedback(isAccent);
    }
  }

  /**
   * Fallback feedback using vibration and console
   */
  playFallbackFeedback(isAccent) {
    console.log(isAccent ? 'TICK (accent)' : 'tick');
    
    // Try to use device vibration as feedback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(isAccent ? 100 : 50);
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
    
    try {
      if (this.platform === 'mobile' && this.sounds) {
        // Update volume for mobile sounds
        if (this.sounds.normal && this.sounds.normal.setVolumeAsync) {
          await this.sounds.normal.setVolumeAsync(this.volume);
        }
        if (this.sounds.accent && this.sounds.accent.setVolumeAsync) {
          await this.sounds.accent.setVolumeAsync(this.volume);
        }
      }
      // Web volume is handled in playWebAudioBeep method
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
      if (this.platform === 'web' && this.audioContext) {
        await this.audioContext.close();
        this.audioContext = null;
      } else if (this.platform === 'mobile' && this.sounds) {
        // Cleanup mobile sounds
        if (this.sounds.normal && this.sounds.normal.unloadAsync) {
          await this.sounds.normal.unloadAsync();
        }
        if (this.sounds.accent && this.sounds.accent.unloadAsync) {
          await this.sounds.accent.unloadAsync();
        }
      }
    } catch (error) {
      console.error('Error cleaning up audio:', error);
    }
    
    this.isInitialized = false;
  }
}

// Singleton instance
export default new MetronomeService();
