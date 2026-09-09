# Installation Guide

## Prerequisites

Before setting up the AgriMarket platform, ensure you have the following installed:

### 1. Node.js (Required)
- Download and install Node.js LTS version (18.x or higher) from https://nodejs.org/
- Verify installation: `node --version` and `npm --version`

### 2. Git (Recommended)
- Download from https://git-scm.com/downloads
- Verify installation: `git --version`

### 3. MySQL Database
- You'll need access to a MySQL database (Aiven recommended for production)
- For development, you can use a local MySQL installation

### 4. Expo CLI (for mobile development)
- Install after Node.js: `npm install -g expo-cli`
- Verify installation: `expo --version`

## Installation Steps

### 1. Install Node.js
1. Visit https://nodejs.org/
2. Download the LTS version for Windows
3. Run the installer with default settings
4. Restart your terminal/command prompt
5. Verify: `node --version`

### 2. Install Expo CLI
```bash
npm install -g expo-cli
```

### 3. Clone/Set up the project
```bash
cd C:\Users\Administrator\Documents\Agrimarket
```

### 4. Install Backend Dependencies
```bash
cd backend
npm install
```

### 5. Install Web Dependencies
```bash
cd ../web
npm install
```

### 6. Install Mobile Dependencies
```bash
cd ../mobile
npm install
```

## Environment Variables

You'll need to configure environment variables for each project. See the respective `.env.example` files in:
- `backend/.env.example`
- `web/.env.example`
- `mobile/.env.example`

## Database Setup

1. Create a MySQL database
2. Run migrations (instructions will be provided after setup)
3. Seed initial data

## Development Setup

After installation, you can start the development servers:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Web
cd web
npm run dev

# Terminal 3 - Mobile
cd mobile
npm start
```

## Troubleshooting

### Node.js not found
- Ensure Node.js is installed and added to PATH
- Restart your terminal after installation
- Try running `node --version` in a new terminal

### Permission errors
- Run your terminal as Administrator
- Or configure npm to use a different directory: `npm config set prefix %APPDATA%\npm`

### Port conflicts
- Backend uses port 5000 (configurable)
- Web uses port 5173 (Vite default)
- Mobile uses port 19000-19002 (Expo default)

## Next Steps

After completing installation, refer to the main README.md for development instructions.
