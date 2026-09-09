# AgriMarket Setup Guide

This guide will help you set up the complete AgriMarket platform including the web application, mobile application, and backend.

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - After installation, verify with: `node --version` and `npm --version`

2. **Git** (optional but recommended)
   - Download from: https://git-scm.com/downloads

3. **MySQL Database**
   - For development: Install MySQL locally or use Docker
   - For production: Set up Aiven MySQL account

4. **Expo CLI** (for mobile development)
   - Install after Node.js: `npm install -g expo-cli`
   - Verify with: `expo --version`

5. **Android Studio** (for Android development)
   - Required for building APK/AAB files
   - Download from: https://developer.android.com/studio

## Project Structure

```
Agrimarket/
├── backend/          # Node.js/Express backend API
├── web/              # React.js web application
├── mobile/           # React Native Android application
├── README.md         # Project overview
├── INSTALLATION.md   # Installation instructions
└── SETUP_GUIDE.md    # This file
```

## Step-by-Step Setup

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Configure your `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=agrimarket
DB_USER=root
DB_PASSWORD=your_password
DB_SSL=false

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173,http://localhost:19006
```

Create and migrate the database:

```bash
npm run migrate
npm run seed
```

Start the backend server:

```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### 2. Web Application Setup

```bash
cd web
npm install
cp .env.example .env
```

Configure your `.env` file:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

Start the web development server:

```bash
npm run dev
```

The web app will run on `http://localhost:5173`

### 3. Mobile Application Setup

```bash
cd mobile
npm install
cp .env.example .env
```

Configure your `.env` file:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000
EXPO_PUBLIC_SOCKET_URL=http://localhost:5000
```

**Important:** Add app icons to `mobile/assets/`:
- `icon.png` (1024x1024)
- `adaptive-icon.png` (1024x1024)
- `splash.png` (2732x2732)
- `favicon.png` (16x16 or 32x32)

Start the Expo development server:

```bash
npm start
```

This will open the Expo DevTools in your browser.

#### Running on Android Device/Emulator:

1. **Using Android Emulator:**
   - Start Android Studio and create an AVD (Android Virtual Device)
   - Run: `npm run android`

2. **Using Physical Device:**
   - Install Expo Go app from Google Play Store
   - Scan the QR code from Expo DevTools with your phone

#### Building APK/AAB:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build APK (for testing)
eas build --platform android --profile preview

# Build AAB (for Play Store)
eas build --platform android --profile production
```

## Development Workflow

### Running All Services Simultaneously

Open three separate terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Web:**
```bash
cd web
npm run dev
```

**Terminal 3 - Mobile:**
```bash
cd mobile
npm start
```

### Testing Authentication

1. **Register a new user:**
   - Web: Navigate to `http://localhost:5173/register`
   - Mobile: Use the register screen
   - Backend: Use Postman/curl to POST to `http://localhost:5000/api/auth/register`

2. **Login:**
   - Use the same credentials to login
   - The token will be stored and used for authenticated requests

### API Testing

You can test the API endpoints using:
- Postman
- curl
- The Swagger UI (if implemented)
- Browser (for GET requests)

Base URL: `http://localhost:5000/api`

## Database Management

### Running Migrations
```bash
cd backend
npm run migrate
```

### Seeding Initial Data
```bash
cd backend
npm run seed
```

### Resetting Database
```bash
# Drop and recreate database
mysql -u root -p -e "DROP DATABASE IF EXISTS agrimarket; CREATE DATABASE agrimarket;"

# Run migrations and seed
npm run migrate
npm run seed
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
   - Change the PORT in `.env` files
   - Kill the process using the port

2. **Database connection failed:**
   - Verify MySQL is running
   - Check database credentials in `.env`
   - Ensure database exists

3. **Module not found errors:**
   - Run `npm install` in the respective directory
   - Delete `node_modules` and `package-lock.json`, then reinstall

4. **Expo build fails:**
   - Ensure Android Studio is properly installed
   - Check that ANDROID_HOME environment variable is set
   - Verify you have accepted Android SDK licenses

5. **CORS errors:**
   - Check CORS_ORIGIN in backend `.env`
   - Ensure frontend URL is included

## Production Deployment

### Backend (Render)

1. Push code to GitHub
2. Create new Render service
3. Connect your GitHub repository
4. Set environment variables in Render dashboard
5. Deploy

### Web (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Mobile (Expo EAS)

1. Configure EAS build profiles in `eas.json`
2. Run `eas build --platform android`
3. Download APK/AAB
4. Upload to Google Play Store

## Security Considerations

### Before Production:

1. **Change all default secrets:**
   - JWT_SECRET
   - Database passwords
   - API keys

2. **Enable SSL:**
   - Use HTTPS for production
   - Configure SSL certificates

3. **Environment variables:**
   - Never commit `.env` files
   - Use different configs for dev/staging/prod

4. **Database:**
   - Use strong passwords
   - Enable SSL connections
   - Restrict database access

5. **API Security:**
   - Implement rate limiting
   - Use CORS properly
   - Validate all inputs

## Next Steps

After completing the setup:

1. Test the authentication flow
2. Verify database connectivity
3. Test API endpoints
4. Run the web and mobile apps
5. Implement additional features as needed

## Support

For issues or questions:
- Check the INSTALLATION.md file
- Review error logs in each terminal
- Consult official documentation for each technology stack

## License

Proprietary - All rights reserved
