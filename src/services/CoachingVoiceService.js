// Coaching Voice Service
// Handles text-to-speech for workout coaching

import { speak, stop } from 'expo-speech';

export class CoachingVoiceService {
  constructor() {
    this.isEnabled = true;
    this.rate = 0.95; // Slightly slower for clarity
    this.pitch = 1.0;
    this.volume = 0.9; // Slightly louder
    this.isInitialized = false;
    this.speechQueue = [];
    this.isSpeaking = false;
    this.platform = 'mobile'; // Default to mobile since we're using expo-speech
    this.voice = null; // Will be set to best available voice
    this.preferredVoices = [
      'com.apple.voice.compact.en-US.Samantha', // Natural female voice
      'com.apple.ttsbundle.Samantha-compact',   // Enhanced Samantha
      'com.apple.voice.compact.en-US.Alex',     // Natural male voice
      'com.apple.ttsbundle.siri_female_en-US_compact', // Siri voice
    ];
  }

  /**
   * Initialize the speech synthesis
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Test if speak function is available
      if (speak && typeof speak === 'function') {
        // Try to get available voices and select the best one
        await this.selectBestVoice();
        this.isInitialized = true;
        console.log('CoachingVoiceService initialized with expo-speech');
        console.log('Selected voice:', this.voice || 'default');
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
   * Select the best available voice
   */
  async selectBestVoice() {
    try {
      // Import getAvailableVoicesAsync from expo-speech
      const { getAvailableVoicesAsync } = await import('expo-speech');
      
      if (getAvailableVoicesAsync && typeof getAvailableVoicesAsync === 'function') {
        const voices = await getAvailableVoicesAsync();
        console.log(`Found ${voices.length} available voices`);
        
        // Try to find one of our preferred voices
        for (const preferredVoice of this.preferredVoices) {
          const found = voices.find(v => v.identifier === preferredVoice);
          if (found) {
            this.voice = found.identifier;
            console.log(`Selected preferred voice: ${this.voice}`);
            return;
          }
        }
        
        // Fallback: find any high-quality English voice
        const enVoice = voices.find(v => 
          v.language.startsWith('en') && 
          (v.quality === 'Enhanced' || v.quality === 'Premium')
        );
        
        if (enVoice) {
          this.voice = enVoice.identifier;
          console.log(`Selected high-quality voice: ${this.voice}`);
        } else {
          console.log('Using default system voice');
        }
      }
    } catch (error) {
      console.log('Could not get available voices, using default:', error.message);
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
      const speechOptions = {
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
      };
      
      // Add voice if we have one selected
      if (this.voice) {
        speechOptions.voice = this.voice;
      }
      
      console.log(`[FARTLEK] Calling expo-speech speak() with:`, {
        message,
        ...speechOptions,
        onDone: '[Function]',
        onError: '[Function]'
      });
      
      speak(message, speechOptions);
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

    // Adjust voice parameters based on cue type for more natural delivery
    switch (cue.type) {
      case 'motivation':
        // Energetic and encouraging
        options.rate = 1.05;
        options.pitch = 1.05;
        options.volume = 1.0;
        break;
      case 'instruction':
        // Clear and authoritative
        options.rate = 0.9;
        options.pitch = 1.0;
        options.volume = 0.95;
        break;
      case 'guidance':
        // Calm and supportive
        options.rate = 0.85;
        options.pitch = 0.95;
        options.volume = 0.85;
        break;
      case 'technique':
        // Focused and precise
        options.rate = 0.88;
        options.pitch = 1.0;
        options.volume = 0.9;
        break;
      default:
        // Neutral delivery
        options.rate = 0.95;
        options.pitch = 1.0;
        options.volume = 0.9;
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