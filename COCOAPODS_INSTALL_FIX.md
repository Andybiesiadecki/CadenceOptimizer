# CocoaPods Installation Fix

## Issue
Your system Ruby (2.6.10) is too old for modern CocoaPods, which requires Ruby 3.0+.

## Solution Options

### Option 1: Install Homebrew and Ruby (Recommended)

1. **Install Homebrew** (if not already installed):
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. **Install Ruby via Homebrew**:
```bash
brew install ruby
```

3. **Add Homebrew Ruby to your PATH** (add to ~/.zshrc):
```bash
echo 'export PATH="/opt/homebrew/opt/ruby/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

4. **Verify Ruby version**:
```bash
ruby --version  # Should show 3.x
```

5. **Install CocoaPods**:
```bash
gem install cocoapods
```

### Option 2: Use rbenv (Alternative)

1. **Install rbenv**:
```bash
curl -fsSL https://github.com/rbenv/rbenv-installer/raw/HEAD/bin/rbenv-installer | bash
```

2. **Add to PATH** (add to ~/.zshrc):
```bash
echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.zshrc
echo 'eval "$(rbenv init -)"' >> ~/.zshrc
source ~/.zshrc
```

3. **Install Ruby 3.3**:
```bash
rbenv install 3.3.0
rbenv global 3.3.0
```

4. **Install CocoaPods**:
```bash
gem install cocoapods
```

### Option 3: Quick Fix with Bundler (Fastest)

If you just want to get building quickly:

1. **Create a Gemfile in the ios directory**:
```bash
cd ios
cat > Gemfile << 'EOF'
source 'https://rubygems.org'
gem 'cocoapods', '~> 1.15'
gem 'ffi', '~> 1.17.3'
EOF
```

2. **Install bundler** (if needed):
```bash
sudo gem install bundler
```

3. **Install dependencies**:
```bash
bundle install
```

4. **Use bundle exec for pod commands**:
```bash
bundle exec pod install
```

5. **Go back to project root and build**:
```bash
cd ..
npx expo run:ios --device
```

## After Installing CocoaPods

Once CocoaPods is installed, return to the project root and run:

```bash
npx expo run:ios --device
```

The build should proceed normally.

## Verification

Check if CocoaPods is installed:
```bash
pod --version
```

Should show version 1.15.x or higher.

## Need Help?

If you're not comfortable with these steps, you can:
1. Install Homebrew (Option 1) - it's useful for many development tools
2. Or use Option 3 (Bundler) for a quick fix specific to this project

Let me know which option you'd like to try!
