# 🚀 Start Relief-Net - Complete Guide

## ⚠️ If Screen is Blank - Follow These Steps

---

## 📋 Step-by-Step Startup

### **Step 1: Fix PowerShell Execution Policy**

Open PowerShell as **Administrator** and run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### **Step 2: Install Frontend Dependencies**

```bash
cd "d:\Decentralized disaster resource sharing app\disaster-resource-frontend"
npm install
npm install react-leaflet leaflet socket.io-client
```

---

### **Step 3: Install Backend Dependencies**

```bash
cd "d:\Decentralized disaster resource sharing app\disaster-resource-backend"
npm install
```

---

### **Step 4: Fix Database (Important!)**

```bash
cd "d:\Decentralized disaster resource sharing app\disaster-resource-backend"
node fixExistingTasks.js
```

---

### **Step 5: Start Backend Server**

```bash
cd "d:\Decentralized disaster resource sharing app\disaster-resource-backend"
npm run dev
```

**Expected output:**
```
✓ MongoDB connected
✓ Server running on port 5001
✓ Socket.IO initialized
```

**Keep this terminal open!**

---

### **Step 6: Start Frontend (New Terminal)**

Open a **NEW terminal** and run:
```bash
cd "d:\Decentralized disaster resource sharing app\disaster-resource-frontend"
npm start
```

**Expected output:**
```
Compiled successfully!
Local: http://localhost:3000
```

**Browser should open automatically!**

---

## 🐛 If Still Blank Screen

### Check Browser Console:
1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Look for red errors
4. Share the error message

### Common Blank Screen Causes:

#### **1. Missing node_modules**
```bash
cd disaster-resource-frontend
npm install
```

#### **2. Port already in use**
```bash
# Kill the process using port 3000
# Then restart
npm start
```

#### **3. Backend not running**
```bash
# Make sure backend is running on port 5001
cd disaster-resource-backend
npm run dev
```

#### **4. Missing .env file**
Create `.env` in backend folder:
```env
MONGO_URI=mongodb://localhost:27017/disaster-resource-db
JWT_SECRET=your-secret-key-here
PORT=5001
```

---

## ✅ Verification Checklist

After starting, you should see:

### **Home Page:**
- [ ] Relief-Net logo
- [ ] "Relief-Net" title
- [ ] "Get Started" and "Login" buttons
- [ ] Features section
- [ ] Technology section
- [ ] Footer with your email

### **After Login:**
- [ ] Header with Relief-Net logo
- [ ] Dashboard, Map, History navigation
- [ ] User avatar (D/R/V/A)
- [ ] Dashboard content
- [ ] Map view (if not admin)

---

## 🔍 Quick Debug Commands

### Check if React is working:
```bash
cd disaster-resource-frontend
npm run build
```

### Check for syntax errors:
Look at the terminal output for any red error messages

### Check backend connection:
Open browser to: http://localhost:5001
Should see: "Disaster Resource Sharing API"

---

## 💡 Alternative: Fresh Start

If nothing works, try a fresh install:

```bash
# Frontend
cd disaster-resource-frontend
rm -rf node_modules package-lock.json
npm install
npm install react-leaflet leaflet socket.io-client

# Backend
cd disaster-resource-backend
rm -rf node_modules package-lock.json
npm install

# Start both
cd disaster-resource-backend
npm run dev

# New terminal
cd disaster-resource-frontend
npm start
```

---

## 📸 What You Should See

### **1. Home Page (Not Logged In):**
```
┌────────────────────────────────────────┐
│         [Logo] Relief-Net              │
│                                        │
│  Decentralized disaster resource...   │
│                                        │
│  [Get Started]  [Login]                │
└────────────────────────────────────────┘
```

### **2. After Login (Volunteer):**
```
┌────────────────────────────────────────┐
│ [Logo] Relief-Net  Dashboard Map [V]   │
├────────────────────────────────────────┤
│  Volunteer Dashboard                   │
│  [✓ Available]                         │
│                                        │
│  Statistics:                           │
│  New Tasks: 2  In Progress: 1         │
│                                        │
│  Your Tasks:                           │
│  [Task Card 1]                         │
│  [Task Card 2]                         │
└────────────────────────────────────────┘
```

---

## 🆘 Still Having Issues?

**Share these details:**
1. Browser console errors (F12 → Console)
2. Terminal errors (from npm start)
3. Backend terminal output
4. What you see on screen (completely blank? error message?)

---

**Follow these steps in order and Relief-Net should work!** 🚀

Last Updated: October 5, 2025
