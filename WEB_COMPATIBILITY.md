# Web Compatibility Guide

## ⚠️ Known Issues and Solutions

### 1. React Native Alert Component
**Problem:** `Alert.alert()` doesn't work reliably on React Native Web
**Symptoms:** 
- Buttons don't respond
- No alert dialogs appear
- Functions stop executing after Alert calls

**Solution:** Use `src/utils/webAlert.js` instead
```javascript
// ❌ Don't use this
import { Alert } from 'react-native';
Alert.alert('Title', 'Message');

// ✅ Use this instead
import { webAlert, showSuccess, showError } from '../utils/webAlert';
webAlert('Title', 'Message');
showSuccess('Success message');
showError('Error message');
```

### 2. File System Access
**Problem:** `expo-file-system` doesn't work on web
**Solution:** Use platform-specific file reading
```javascript
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  // Use browser File API
  const response = await fetch(fileUri);
  const blob = await response.blob();
  // ... handle with FileReader
} else {
  // Use expo-file-system for mobile
  const FileSystem = require('expo-file-system/legacy');
  // ... use FileSystem methods
}
```

### 3. Audio Playback
**Problem:** Some audio features may not work on web
**Solution:** Test audio functionality and provide fallbacks

### 4. Navigation Issues
**Problem:** Navigation might fail in certain contexts
**Solution:** Always wrap navigation calls in try-catch
```javascript
try {
  if (navigation && navigation.navigate) {
    navigation.navigate('Home');
  }
} catch (navError) {
  console.error('Navigation error:', navError);
  // Provide fallback or user instruction
}
```

## 🧪 Testing Checklist

Before deploying web features, test:
- [ ] All button interactions work
- [ ] Alert dialogs appear and function correctly
- [ ] File uploads work (both direct files and ZIP archives)
- [ ] Navigation between screens works
- [ ] Form submissions complete successfully
- [ ] Audio playback works (if applicable)

## 🛠️ Development Guidelines

1. **Always test on web** during development
2. **Use webAlert utilities** instead of React Native Alert
3. **Implement platform-specific code** when needed
4. **Add error handling** for web-specific issues
5. **Document any web-specific workarounds**

## 📱 Mobile Compatibility

The webAlert utilities maintain full mobile compatibility:
- Web: Uses browser's native `alert()` and `confirm()`
- Mobile: Uses React Native's `Alert.alert()`

This ensures the same code works across all platforms.