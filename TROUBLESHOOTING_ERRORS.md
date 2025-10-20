# 🔧 Relief-Net - Error Troubleshooting Guide

## 🐛 Common Errors & Solutions

---

## 1️⃣ PowerShell Execution Policy Error

### Error:
```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because 
running scripts is disabled on this system.
```

### Solution:
Run PowerShell as Administrator and execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try again:
```bash
npm start
```

---

## 2️⃣ Module Not Found Errors

### Error:
```
Module not found: Can't resolve 'react-leaflet'
Module not found: Can't resolve 'leaflet'
Module not found: Can't resolve 'socket.io-client'
```

### Solution:
Install missing dependencies:
```bash
cd disaster-resource-frontend
npm install react-leaflet leaflet socket.io-client
npm install leaflet-defaulticon-compatibility
```

---

## 3️⃣ Server Error When Accepting Task

### Error:
```
Server error 500
Cannot read property 'push' of undefined
```

### Solution:
Run the database fix script:
```bash
cd disaster-resource-backend
node fixExistingTasks.js
```

Then restart backend:
```bash
npm run dev
```

---

## 4️⃣ Map Not Displaying

### Possible Causes:
- Leaflet CSS not imported
- Invalid coordinates (0, 0)
- Map container has no height

### Solution:
1. Check if leaflet CSS is imported in MapView.jsx
2. Verify user locations are set properly
3. Ensure map container has height

---

## 5️⃣ Live Tracking Not Working

### Possible Causes:
- GPS permission denied
- Socket.IO not connected
- Backend not running

### Solution:
1. Allow browser location permission
2. Check backend is running on port 5001
3. Check browser console for Socket.IO connection
4. Verify volunteer clicked "Start Transit"

---

## 6️⃣ Navigation Not Working

### Error:
```
Cannot read property 'scrollIntoView' of null
```

### Solution:
This is now fixed! Navigation uses page switching, not scrolling.
Just restart the frontend.

---

## 7️⃣ CORS Errors

### Error:
```
Access to XMLHttpRequest blocked by CORS policy
```

### Solution:
Backend already has CORS configured. Ensure:
- Backend running on port 5001
- Frontend running on port 3000
- Both servers are running

---

## 8️⃣ MongoDB Connection Error

### Error:
```
MongooseError: Could not connect to MongoDB
```

### Solution:
1. Check MongoDB is running
2. Verify MONGO_URI in .env file
3. Check network connection

---

## 🚀 Quick Fix Checklist

Run these in order:

### Step 1: Set PowerShell Policy
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Step 2: Install Dependencies
```bash
cd disaster-resource-frontend
npm install react-leaflet leaflet socket.io-client
```

### Step 3: Fix Database
```bash
cd disaster-resource-backend
node fixExistingTasks.js
```

### Step 4: Start Backend
```bash
cd disaster-resource-backend
npm run dev
```

### Step 5: Start Frontend
```bash
cd disaster-resource-frontend
npm start
```

---

## 🧪 Verify Everything Works

### Test Checklist:
- [ ] Home page loads
- [ ] Can register new user
- [ ] Can login
- [ ] Dashboard displays
- [ ] Navigation works (Dashboard, Map, Profile, Settings)
- [ ] Map shows India (Kerala)
- [ ] Can accept task (volunteer)
- [ ] GPS tracking works
- [ ] Live map updates
- [ ] Can complete delivery
- [ ] Profile page accessible
- [ ] Settings page accessible
- [ ] History shows completed deliveries

---

## 📝 If Errors Persist

### Check Browser Console:
1. Open DevTools (F12)
2. Go to Console tab
3. Look for red errors
4. Share the error message

### Check Backend Console:
1. Look at terminal running backend
2. Check for error messages
3. Verify MongoDB connection
4. Check Socket.IO connection

### Common Issues:
- **Port already in use**: Kill process or use different port
- **MongoDB not running**: Start MongoDB service
- **Missing .env file**: Create with MONGO_URI and JWT_SECRET
- **Node modules missing**: Run `npm install` in both folders

---

## 🔍 Detailed Error Debugging

### Frontend Errors:
```bash
# Check for syntax errors
cd disaster-resource-frontend
npm run build
```

### Backend Errors:
```bash
# Check for syntax errors
cd disaster-resource-backend
node server.js
```

### Database Errors:
```bash
# Check MongoDB connection
mongosh
show dbs
use disaster-resource-db
db.users.find().limit(1)
```

---

## 💡 Quick Fixes

### Clear Cache:
```bash
cd disaster-resource-frontend
rm -rf node_modules
npm install
```

### Reset Database (if needed):
```bash
# In MongoDB shell
use disaster-resource-db
db.deliverytasks.updateMany({}, {$set: {statusHistory: [], locationHistory: []}})
```

### Restart Everything:
```bash
# Kill all node processes
# Then restart backend and frontend
```

---

## 📞 Need Help?

**Email:** aaswathyachu123@gmail.com

**Share:**
1. Error message (exact text)
2. Browser console errors
3. Backend console errors
4. What you were trying to do

---

**Most errors can be fixed by following the steps above!** 🔧

Last Updated: October 5, 2025
