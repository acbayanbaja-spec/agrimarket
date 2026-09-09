# Mobile App Icons Required

To build the Android APK/AAB, you need to add these icon files to the `mobile/assets/` directory:

## Required Icons

### 1. icon.png (1024x1024 pixels)
- Main app icon
- Used by app stores and device home screens
- Format: PNG with transparency
- Size: 1024x1024 pixels
- Design: Your AgriMarket logo

### 2. adaptive-icon.png (1024x1024 pixels)
- Android adaptive icon
- Used on Android 8.0+ devices
- Format: PNG without transparency
- Size: 1024x1024 pixels
- Design: Simple version of your logo (safe zone: 666x666 center)

### 3. splash.png (2732x2732 pixels)
- Splash screen image
- Format: PNG
- Size: 2732x2732 pixels
- Design: Your brand loading screen

### 4. favicon.png (16x16 or 32x32 pixels)
- Web favicon (for Expo web)
- Format: PNG
- Size: 16x16 or 32x32 pixels
- Design: Mini version of your logo

## Quick Solutions

### Option 1: Use Online Tools
- https://www.favicon-generator.org/ - Generate from text/image
- https://appicon.co/ - Generate app icons from one image
- https://www.canva.com/ - Design icons from scratch

### Option 2: Use Simple Placeholder
For development/testing, you can create simple colored squares:

1. Create a green square (1024x1024) for icon.png
2. Create a green square (1024x1024) for adaptive-icon.png
3. Create a green rectangle (2732x2732) for splash.png
4. Create a small green square (32x32) for favicon.png

### Option 3: Use AI Image Generator
- Use ChatGPT/DALL-E to generate icons
- Prompt: "Create a simple agricultural marketplace icon with green leaves, minimal design, white background, 1024x1024 pixels"

## How to Add Icons

1. Create the icon files using one of the methods above
2. Place them in `mobile/assets/` directory
3. Make sure filenames match exactly:
   - `icon.png`
   - `adaptive-icon.png`
   - `splash.png`
   - `favicon.png`

## Verify Icons

Before building, verify the files exist:
```bash
cd mobile/assets
dir
```

You should see all 4 icon files.

## Update app.json (Optional)

If you want to customize the app appearance, edit `mobile/app.json`:

```json
{
  "expo": {
    "name": "AgriMarket",
    "slug": "agrimarket",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.agrimarket.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.agrimarket.app"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

## Icon Design Tips

For AgriMarket, consider:
- **Green color scheme** (#16a34a or similar)
- **Leaf or plant icon** for agricultural theme
- **Simple, clean design** for scalability
- **White background** for adaptive icon
- **Minimal text** - icons should be recognizable without text

## Testing Without Icons

For immediate testing, you can:
1. Use Expo Go app to test without building APK
2. Build APK later when you have proper icons
3. Test the web version while designing icons

## Timeline

- **Icon design**: 30-60 minutes
- **Icon generation**: 5-10 minutes
- **Placement in assets**: 2 minutes
- **Build APK**: 2-3 hours (mostly waiting)

You can design icons while the Android build is running!
