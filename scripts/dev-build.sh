#!/bin/bash

# STRDR Local Development Build Script
# This script automates the local build process for testing Build 12

set -e  # Exit on error

echo "🏃 STRDR Development Build Script"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Check prerequisites
echo "Step 1: Checking prerequisites..."
echo ""

if ! command -v xcodebuild &> /dev/null; then
    print_error "Xcode is not installed"
    exit 1
fi
print_success "Xcode installed: $(xcodebuild -version | head -n 1)"

if ! command -v npx &> /dev/null; then
    print_error "npm/npx is not installed"
    exit 1
fi
print_success "Expo CLI available"

echo ""

# Ask user for device type
echo "Step 2: Select build target"
echo ""
echo "1) Physical iPhone (connected via USB)"
echo "2) iOS Simulator"
echo ""
read -p "Enter your choice (1 or 2): " device_choice

if [ "$device_choice" = "1" ]; then
    BUILD_TARGET="device"
    print_info "Building for physical iPhone..."
elif [ "$device_choice" = "2" ]; then
    BUILD_TARGET="simulator"
    print_info "Building for iOS Simulator..."
else
    print_error "Invalid choice. Please run again and select 1 or 2."
    exit 1
fi

echo ""

# Ask about cleaning
echo "Step 3: Clean previous builds?"
echo ""
read -p "Clean previous builds? (recommended for first build) [y/N]: " clean_choice

if [[ "$clean_choice" =~ ^[Yy]$ ]]; then
    print_info "Cleaning previous builds..."
    
    if [ -d "ios/build" ]; then
        rm -rf ios/build
        print_success "Removed ios/build"
    fi
    
    print_info "Clearing Expo cache..."
    npx expo start --clear &
    EXPO_PID=$!
    sleep 3
    kill $EXPO_PID 2>/dev/null || true
    print_success "Cache cleared"
fi

echo ""

# Install dependencies
echo "Step 4: Installing dependencies..."
echo ""
npm install
print_success "Dependencies installed"

echo ""

# Prebuild
echo "Step 5: Generating native iOS project..."
echo ""
print_warning "This may take a minute..."
npx expo prebuild --platform ios
print_success "iOS project configured"

echo ""

# Build and run
echo "Step 6: Building and installing app..."
echo ""
print_warning "This will take 5-10 minutes on first build..."
print_info "The app will launch automatically when ready"
echo ""

if [ "$BUILD_TARGET" = "device" ]; then
    print_info "Make sure your iPhone is connected and unlocked!"
    sleep 2
    npx expo run:ios --device
else
    print_info "Simulator will launch automatically..."
    npx expo run:ios
fi

echo ""
print_success "Build complete! App should be running on your device."
echo ""
echo "📋 Testing Checklist:"
echo "  1. Navigate to Metronome screen"
echo "  2. Select FARTLEK mode"
echo "  3. Tap START (dismiss debug alert)"
echo "  4. Wait for phase change (~30-60 seconds)"
echo "  5. Listen for voice coaching 🎙️"
echo "  6. Watch for alert popups 📱"
echo ""
echo "See LOCAL_DEV_BUILD_GUIDE.md for detailed testing instructions."
echo ""
