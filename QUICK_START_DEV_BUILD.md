# Quick Start - Local Development Build

## TL;DR - Three Ways to Build

### Option 1: Automated Script (Easiest) ⭐
```bash
npm run dev-build
```
Follow the prompts to select device type and build options.

### Option 2: Direct Commands

**For Physical iPhone:**
```bash
npx expo run:ios --device
```

**For iOS Simulator:**
```bash
npx expo run:ios
```

### Option 3: npm Scripts

**For Physical iPhone:**
```bash
npm run ios:device
```

**For iOS Simulator:**
```bash
npm run ios
```

---

## What to Expect

1. **First time:** 5-10 minutes (Xcode builds native code)
2. **Subsequent builds:** 1-2 minutes (cached)
3. **App launches automatically** when ready
4. **Metro bundler** starts in terminal (keep it running)

---

## Testing Build 12

Once app launches:

1. Go to **Metronome** screen
2. Select **FARTLEK** mode
3. Tap **START** (dismiss debug alert)
4. Wait ~30-60 seconds for first phase change
5. **Listen for voice coaching** 🎙️
6. **Watch for alert popups** 📱

### Success = You hear voice AND see alerts!

---

## Troubleshooting

**Build fails?**
```bash
rm -rf ios/build
npx expo run:ios
```

**App crashes?**
- Check Metro bundler console for errors
- Press `r` to reload

**No voice?**
- Check device volume
- Check silent mode switch
- Look for "[FARTLEK] Speaking coaching cue" in console

---

## Full Documentation

See `LOCAL_DEV_BUILD_GUIDE.md` for complete step-by-step instructions.
