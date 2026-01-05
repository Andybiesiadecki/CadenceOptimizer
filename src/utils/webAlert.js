// Web-compatible alert utility
import { Platform, Alert } from 'react-native';

/**
 * Cross-platform alert that works on web and mobile
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {Array} buttons - Button configuration (optional)
 */
export const webAlert = (title, message, buttons = [{ text: 'OK' }]) => {
  if (Platform.OS === 'web') {
    // Use browser's native alert for web
    const result = window.confirm(`${title}\n\n${message}`);
    
    // Handle button callbacks
    if (buttons.length > 1) {
      const button = result ? buttons[1] : buttons[0]; // OK/Cancel pattern
      if (button.onPress) button.onPress();
    } else if (buttons[0].onPress) {
      buttons[0].onPress();
    }
  } else {
    // Use React Native Alert for mobile
    Alert.alert(title, message, buttons);
  }
};

/**
 * Simple success message that works everywhere
 * @param {string} message - Success message
 * @param {Function} onComplete - Callback when dismissed
 */
export const showSuccess = (message, onComplete) => {
  if (Platform.OS === 'web') {
    window.alert(`✅ ${message}`);
    if (onComplete) onComplete();
  } else {
    Alert.alert('Success! 🎉', message, [
      { text: 'OK', onPress: onComplete }
    ]);
  }
};

/**
 * Simple error message that works everywhere
 * @param {string} message - Error message
 */
export const showError = (message) => {
  if (Platform.OS === 'web') {
    window.alert(`❌ ${message}`);
  } else {
    Alert.alert('Error', message);
  }
};