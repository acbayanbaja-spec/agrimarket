# AgriMarket Deployment Guide

## Overview
This guide will help you deploy the AgriMarket platform to:
1. **Vercel** - Web application
2. **Render** - Backend API
3. **Expo EAS** - Android APK/AAB

## Prerequisites
- ✅ GitHub repository created and code pushed
- ✅ Node.js installed
- ✅ Vercel account (free at vercel.com)
- ✅ Render account (free at render.com)
- ✅ Expo account (free at expo.dev)

---

## Part 1: Vercel Deployment (Web Application)

### Step 1: Connect Vercel to GitHub

1. Go to https://vercel.com and sign up/login
2. Click "Add New Project"
3. Import your `agrimarket` repository from GitHub
4. Vercel will ask for import scope - select your account

### Step 2: Configure Vercel Project

**Project Settings:**
- **Framework Preset**: Vite
- **Root Directory**: `web`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

**Environment Variables:**
Add these in Vercel dashboard → Settings → Environment Variables:

```
VITE_API_URL=https://agrimarket-backend.onrender.com
VITE_SOCKET_URL=https://agrimarket-backend.onrender.com
```

### Step 3: Deploy

1. Click "Deploy"
2. Vercel will build and deploy your web app
3. Wait for deployment to complete (~2-3 minutes)
4. You'll get a URL like: `https://agrimarket-xyz.vercel.app`

### Step 4: Update Backend CORS

After getting your Vercel URL, update the backend CORS configuration:
- Go to Render dashboard
- Update `CORS_ORIGIN` to include your Vercel URL

---

## Part 2: Render Deployment (Backend API)

### Step 1: Connect Render to GitHub

1. Go to https://render.com and sign up/login
2. Click "New +"
3. Select "Web Service"
4. Connect your GitHub repository
5. Select the `agrimarket` repository

### Step 2: Configure Render Service

**Basic Settings:**
- **Name**: `agrimarket-backend`
- **Region**: Singapore (or closest to Philippines)
- **Branch**: `main`
- **Root Directory**: `backend`

**Build Settings:**
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

**Environment Variables:**
Add these in Render dashboard:

```
NODE_ENV=production
PORT=10000
DB_HOST=mysql-3436c73a-angelmargaretteestores-969b.g.aivencloud.com
DB_PORT=22689
DB_NAME=defaultdb
DB_USER=avnadmin
DB_PASSWORD=your_aiven_password
DB_SSL=true
JWT_SECRET=your_secure_jwt_secret_change_this
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://your-vercel-url.vercel.app,exp://localhost:19000
FRONTEND_URL=https://your-vercel-url.vercel.app
MOBILE_URL=exp://localhost:19000
```

### Step 3: Deploy

1. Click "Create Web Service"
2. Render will build and deploy (~3-5 minutes)
3. You'll get a URL like: `https://agrimarket-backend.onrender.com`

### Step 4: Run Database Migrations

Since Render provides a deployed backend, you'll need to run migrations:

1. Go to Render dashboard → your service
2. Click "Shell" tab
3. Run these commands:
```bash
cd /opt/render/project/backend
npm run migrate
npm run seed
```

### Step 5: Update Vercel Environment Variables

1. Go back to Vercel dashboard
2. Update environment variables with your Render URL:
```
VITE_API_URL=https://agrimarket-backend.onrender.com
VITE_SOCKET_URL=https://agrimarket-backend.onrender.com
```
3. Redeploy Vercel

---

## Part 3: Android App Build (Expo EAS)

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
cd mobile
eas login
```

This will open a browser for authentication.

### Step 3: Configure EAS Build

```bash
cd mobile
eas build:configure
```

This will create/update `eas.json` configuration.

### Step 4: Add App Icons (Required)

You need to add actual app icons before building:

1. Create or download icons:
   - `icon.png` (1024x1024 pixels)
   - `adaptive-icon.png` (1024x1024 pixels)
   - `splash.png` (2732x2732 pixels)
   - `favicon.png` (16x16 or 32x32 pixels)

2. Place them in `mobile/assets/` directory

3. Update `mobile/app.json` if needed

### Step 5: Build APK (For Testing)

```bash
cd mobile
eas build --platform android --profile preview
```

This will build an APK file (~2-3 hours for first build).

### Step 6: Build AAB (For Play Store)

```bash
cd mobile
eas build --platform android --profile production
```

This builds an Android App Bundle for Play Store submission.

### Step 7: Download and Install

1. After build completes, Expo will email you a download link
2. Download the APK file
3. Transfer to your Android device
4. Enable "Install from unknown sources" in phone settings
5. Install the APK

---

## Part 4: Update Environment Variables for Production

### Backend (Render)
After deployment, update these sensitive values:

```
JWT_SECRET=generate_a_secure_random_string
SMS_API_KEY=your_sms_provider_key
PAYMENT_API_KEY=your_payment_provider_key
```

### Web (Vercel)
Update with production backend URL:

```
VITE_API_URL=https://agrimarket-backend.onrender.com
VITE_SOCKET_URL=https://agrimarket-backend.onrender.com
```

### Mobile (Expo)
Update `mobile/.env`:

```
EXPO_PUBLIC_API_URL=https://agrimarket-backend.onrender.com
EXPO_PUBLIC_SOCKET_URL=https://agrimarket-backend.onrender.com
```

---

## Part 5: Testing Deployed Applications

### Test Web Application
1. Open your Vercel URL
2. Test registration and login
3. Verify database connection
4. Test navigation

### Test Backend API
1. Test health endpoint: `https://agrimarket-backend.onrender.com/health`
2. Test authentication endpoints
3. Verify database connectivity

### Test Mobile App
1. Install the APK on your device
2. Test authentication
3. Verify API connection
4. Test all features

---

## Troubleshooting

### Vercel Issues
- **Build fails**: Check build logs in Vercel dashboard
- **Environment variables not working**: Redeploy after adding variables
- **API connection failed**: Verify CORS settings in backend

### Render Issues
- **Service not starting**: Check Render logs
- **Database connection failed**: Verify Aiven credentials
- **Migration needed**: Use Render Shell to run migrations

### EAS Build Issues
- **Build fails**: Check EAS build logs
- **Missing icons**: Add required icon files
- **Permissions denied**: Check Expo account permissions

---

## Cost Summary

### Free Tier Limits
- **Vercel**: Free tier sufficient for development
- **Render**: Free web service (spins down after inactivity)
- **Expo EAS**: Free tier limited builds per month
- **Aiven MySQL**: You have existing service

### Production Recommendations
- **Vercel Pro**: $20/month for better performance
- **Render Standard**: $7/month for always-on backend
- **Expo EAS**: Pricing based on build count

---

## Security Notes

### Before Production
1. Change all default secrets
2. Enable SSL everywhere
3. Use environment variables for sensitive data
4. Enable rate limiting
5. Set up monitoring and logging
6. Implement proper error handling

### Regular Maintenance
1. Update dependencies regularly
2. Monitor for security vulnerabilities
3. Backup database regularly
4. Review access logs
5. Update SSL certificates

---

## Next Steps

After successful deployment:

1. **Test thoroughly** all features
2. **Set up monitoring** (Vercel Analytics, Render logs)
3. **Configure backups** for database
4. **Set up CI/CD** for automated deployments
5. **Create documentation** for your team
6. **Plan scaling** for production traffic

---

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Render Docs**: https://render.com/docs
- **Expo EAS Docs**: https://docs.expo.dev/build/introduction
- **Aiven Docs**: https://aiven.io/docs

---

## Summary

After completing this guide, you'll have:

✅ **Web Application**: Deployed on Vercel
✅ **Backend API**: Deployed on Render  
✅ **Android App**: APK/AAB built with Expo EAS
✅ **Database**: Connected to Aiven MySQL
✅ **Production Ready**: Full platform deployed

The AgriMarket platform will be fully functional and accessible to users!
