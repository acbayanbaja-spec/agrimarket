# Quick Start Guide - AgriMarket

## ✅ Installation Complete!

Node.js has been successfully installed on this system:
- **Node.js**: v24.19.0
- **npm**: 11.17.0

All project dependencies have been installed:
- ✅ Backend dependencies (459 packages)
- ✅ Web dependencies (323 packages)  
- ✅ Mobile dependencies (1,259 packages)

Environment files have been configured from `.env.example` files.

## 🚀 Next Steps

### 1. Database Setup

You need to set up a MySQL database before running the applications. 

**Option A: Local MySQL Installation**
```bash
# Install MySQL on Windows (if not already installed)
# You can use MySQL Installer from https://dev.mysql.com/downloads/installer/
```

**Option B: Use MySQL Docker (if Docker is available)**
```bash
docker run --name agrimarket-mysql -e MYSQL_ROOT_PASSWORD=your_password -e MYSQL_DATABASE=agrimarket -p 3306:3306 -d mysql:8.0
```

**Option C: Use Aiven MySQL (Recommended for Production)**
- Sign up at https://aiven.io/
- Create a MySQL service
- Get connection details and update backend/.env

### 2. Configure Database Connection

Edit `backend/.env` and update the database settings:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=agrimarket
DB_USER=root
DB_PASSWORD=your_actual_password
```

### 3. Run Database Migrations

Once MySQL is running:

```bash
cd backend
$env:PATH = "C:\Program Files\nodejs;$env:PATH"
& "C:\Program Files\nodejs\npm.cmd" run migrate
```

### 4. Seed Initial Data

```bash
cd backend
$env:PATH = "C:\Program Files\nodejs;$env:PATH"
& "C:\Program Files\nodejs\npm.cmd" run seed
```

### 5. Start the Applications

**Backend (Terminal 1):**
```bash
cd backend
$env:PATH = "C:\Program Files\nodejs;$env:PATH"
& "C:\Program Files\nodejs\npm.cmd" run dev
```

**Web Application (Terminal 2):**
```bash
cd web
$env:PATH = "C:\Program Files\nodejs;$env:PATH"
& "C:\Program Files\nodejs\npm.cmd" run dev
```

**Mobile Application (Terminal 3):**
```bash
cd mobile
$env:PATH = "C:\Program Files\nodejs;$env:PATH"
& "C:\Program Files\nodejs\npm.cmd" start
```

## 📱 Testing the Applications

### Web Application
- Open browser to: `http://localhost:5173`
- You should see the AgriMarket homepage

### Mobile Application
- Install Expo Go app on your Android device from Google Play Store
- Scan the QR code from the Expo DevTools
- Or use Android Emulator: `npm run android`

### Backend API
- Health check: `http://localhost:5000/health`
- API base URL: `http://localhost:5000/api`

## 🔧 Troubleshooting

### "mysql not found" error
- Ensure MySQL is installed and running
- Check that database credentials in backend/.env are correct

### Port already in use
- Change PORT in backend/.env (default is 5000)
- Change port in web/vite.config.ts (default is 5173)

### Permission errors
- Run PowerShell as Administrator
- Or adjust execution policy: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

## 📝 Important Notes

### Database Required
The applications **require a MySQL database** to function properly. Without the database:
- Authentication won't work
- Products cannot be stored
- Orders cannot be processed

### Temporary Workaround
If you want to test the UI without database:
- The web app will load but features will be limited
- Mobile app will show placeholder screens
- Authentication will show mock behavior

### Security Notes
- The current JWT_SECRET in .env is for development only
- Change it before production deployment
- Never commit .env files to version control

## 🎯 What's Working Now

Without database, you can still:
- ✅ View the web application UI
- ✅ View the mobile application screens
- ✅ Navigate through the interface
- ✅ See the layout and design

With database, you can:
- ✅ Register and login users
- ✅ Create products (as seller)
- ✅ Browse marketplace
- ✅ Place orders
- ✅ Use all features

## 📚 Additional Resources

- Full setup guide: `SETUP_GUIDE.md`
- Installation instructions: `INSTALLATION.md`
- Project overview: `README.md`

## 🆘 Need Help?

If you encounter issues:
1. Check the error messages in each terminal
2. Verify MySQL is running
3. Check database credentials in backend/.env
4. Ensure all services are running in separate terminals

## 🎉 You're Ready!

Once you have MySQL set up and configured, you can start building the full agricultural marketplace platform. The foundation is complete and ready for development!
