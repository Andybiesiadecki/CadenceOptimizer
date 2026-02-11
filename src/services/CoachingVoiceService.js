// Coaching Voice Service
// Handles text-to-speech for workout coaching

import { speak, stop } from 'expo-speech';

export class CoachingVoiceService {
  constructor() {
    this.isEnabled = true;
    this.rate = 1.0;
    this.pitch = 1.0;
    this.volume = 0.8;
    this.isInitialized = false;
    this.speechQueue = [];
    this.isSpeaking = false;
    this.platform = 'mobile'; // Default to mobile since we're using expo-speech
  }

  /**
   * Initialize the speech synthesis
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Test if speak function is available
      if (speak && typeof speak === 'function') {
        this.isInitialized = true;
        console.log('CoachingVoiceService initialized with expo-speech');
      } else {
        console.log('expo-speech not available, using fallback');
        this.platform = 'fallback';
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Failed to initialize CoachingVoiceService:', error);
      this.platform = 'fallback';
      this.isInitialized = true;
    }
  }

  /**
   * Speak a coaching message
   * @param {string} message - Message to speak
   * @param {Object} options - Speech options
   */
  async speak(message, options = {}) {
    if (!this.isEnabled || !message) {
      console.log('[FARTLEK] Speech disabled or no message');
      return;
    }

    await this.initialize();

    console.log(`[FARTLEK] Speak called with message: "${message}"`);

    const speechOptions = {
      rate: options.rate || this.rate,
      pitch: options.pitch || this.pitch,
      volume: options.volume || this.volume,
      priority: options.priority || 'normal', // low, normal, high, urgent
      interrupt: options.interrupt || false,
    };

    // Handle interruption
    if (speechOptions.interrupt && this.isSpeaking) {
      console.log('[FARTLEK] Interrupting current speech');
      this.stopSpeaking();
    }

    // Add to queue or speak immediately
    if (speechOptions.priority === 'urgent' || !this.isSpeaking) {
      console.log('[FARTLEK] Speaking immediately');
      await this.speakNow(message, speechOptions);
    } else {
      console.log('[FARTLEK] Adding to speech queue');
      this.speechQueue.push({ message, options: speechOptions });
      this.processQueue();
    }
  }

  /**
   * Speak message immediately
   * @param {string} message - Message to speak
   * @param {Object} options - Speech options
   */
  async speakNow(message, options) {
    this.isSpeaking = true;
    console.log(`[FARTLEK] speakNow called, platform: ${this.platform}`);

    try {
      if (this.platform === 'mobile' && speak && typeof speak === 'function') {
        console.log('[FARTLEK] Using mobile speech');
        await this.speakMobile(message, options);
      } else {
        // Fallback - just log the message
        console.log(`[FARTLEK] 🗣️ Coach (fallback): ${message}`);
        this.isSpeaking = false;
      }
    } catch (error) {
      console.error('[FARTLEK] Error speaking message:', error);
      console.log(`[FARTLEK] 🗣️ Coach (error fallback): ${message}`);
      this.isSpeaking = false;
    }
  }

  /**
   * Speak using Expo Speech
   * @param {string} message - Message to speak
   * @param {Object} options - Speech options
   */
  async speakMobile(message, options) {
    try {
      console.log(`[FARTLEK] Calling expo-speech speak() with:`, {
        message,
        language: 'en-US',
        pitch: options.pitch || this.pitch,
        rate: options.rate || this.rate,
        volume: options.volume || this.volume
      });
      
      speak(message, {
        language: 'en-US',
        pitch: options.pitch || this.pitch,
        rate: options.rate || this.rate,
        volume: options.volume || this.volume,
        onDone: () => {
          console.log('[FARTLEK] Speech completed');
          this.isSpeaking = false;
          this.processQueue();
        },
        onError: (error) => {
          console.error('[FARTLEK] Mobile speech error:', error);
          this.isSpeaking = false;
          this.processQueue();
        }
      });
    } catch (error) {
      console.error('[FARTLEK] Error with mobile speech:', error);
      console.log(`[FARTLEK] 🗣️ Coach (fallback): ${message}`);
      this.isSpeaking = false;
      this.processQueue();
    }
  }

  /**
   * Process the speech queue
   */
  processQueue() {
    if (this.isSpeaking || this.speechQueue.length === 0) return;

    const next = this.speechQueue.shift();
    this.speakNow(next.message, next.options);
  }

  /**
   * Stop current speech
   */
  stopSpeaking() {
    try {
      if (stop && typeof stop === 'function') {
        stop();
      }
      
      this.isSpeaking = false;
      this.speechQueue = [];
    } catch (error) {
      console.error('Error stopping speech:', error);
      this.isSpeaking = false;
      this.speechQueue = [];
    }
  }

  /**
   * Set voice enabled/disabled
   * @param {boolean} enabled - Whether voice is enabled
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopSpeaking();
    }
  }

  /**
   * Set voice parameters
   * @param {Object} params - Voice parameters
   */
  setVoiceParameters(params) {
    if (params.rate !== undefined) this.rate = Math.max(0.1, Math.min(2.0, params.rate));
    if (params.pitch !== undefined) this.pitch = Math.max(0.1, Math.min(2.0, params.pitch));
    if (params.volume !== undefined) this.volume = Math.max(0, Math.min(1, params.volume));
  }

  /**
   * Get available voices (not supported on mobile)
   * @returns {Array} Available voices
   */
  getAvailableVoices() {
    return [];
  }

  /**
   * Set specific voice (not supported on mobile)
   * @param {Object} voice - Voice object
   */
  setVoice(voice) {
    // Not supported on mobile
  }

  /**
   * Speak workout-specific messages with appropriate tone
   * @param {Object} cue - Coaching cue object
   */
  async speakCoachingCue(cue) {
    if (!cue || !cue.message) {
      console.log('[FARTLEK] No cue message to speak');
      return;
    }

    console.log(`[FARTLEK] Speaking coaching cue: "${cue.message}" (${cue.type})`);

    const options = {
      interrupt: cue.priority === 'urgent',
      priority: cue.priority,
    };

    // Adjust voice parameters based on cue type
    switch (cue.type) {
      case 'motivation':
        options.rate = 1.1;
        options.pitch = 1.1;
        options.volume = 0.9;
        break;
      case 'instruction':
        options.rate = 0.9;
        options.pitch = 1.0;
        options.volume = 0.8;
        break;
      case 'guidance':
        options.rate = 0.8;
        options.pitch = 0.9;
        options.volume = 0.7;
        break;
      case 'technique':
        options.rate = 0.85;
        options.pitch = 1.0;
        options.volume = 0.8;
        break;
      default:
        options.rate = 1.0;
        options.pitch = 1.0;
        options.volume = 0.8;
    }

    console.log(`[FARTLEK] Voice options:`, options);
    await this.speak(cue.message, options);
  }

  /**
   * Get current status
   * @returns {Object} Current status
   */
  getStatus() {
    return {
      isEnabled: this.isEnabled,
      isSpeaking: this.isSpeaking,
      platform: this.platform,
      queueLength: this.speechQueue.length,
      voice: 'Default',
      rate: this.rate,
      pitch: this.pitch,
      volume: this.volume,
    };
  }
}

// Singleton instance
export default new CoachingVoiceService();