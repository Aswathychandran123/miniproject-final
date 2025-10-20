# 🔧 Fix Blank Screen - Relief-Net

## ⚠️ Blank Screen? Follow This Guide

---

## 🎯 Most Likely Cause

**Missing Dependencies** - The app needs `react-leaflet` and `leaflet` packages installed.

---

## ✅ Quick Fix (Run These Commands)

### **1. Fix PowerShell (If needed)**
```powershell
# Run PowerShell as Administrator
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### **2. Install All Dependencies**
```bash
cd "d:\Decentralized disaster resource sharing app\disaster-resource-frontend"
npm install react-leaflet leaflet socket.io-client
```

### **3. Start Frontend**
```bash
npm start
```

**That's it! The blank screen should be fixed.**

---

## 🔍 If Still Blank - Check Browser Console

1. Open browser (Chrome/Edge)
2. Press **F12** (DevTools)
3. Click **Console** tab
4. Look for errors

### Common Errors:

#### **Error: "Module not found: Can't resolve 'leaflet'"**
**Fix:**
```bash
npm install leaflet react-leaflet
```

#### **Error: "Module not found: Can't resolve 'socket.io-client'"**
**Fix:**
```bash
npm install socket.io-client
```

#### **Error: "Failed to fetch"**
**Fix:** Start the backend server
```bash
cd disaster-resource-backend
npm run dev
```

---

## 🚀 Complete Startup Sequence

### **Terminal 1 - Backend:**
```bash
cd "d:\Decentralized disaster resource sharing app\disaster-resource-backend"
npm install
npm run dev
```

**Wait for:** `✓ Server running on port 5001`

### **Terminal 2 - Frontend:**
```bash
cd "d:\Decentralized disaster resource sharing app\disaster-resource-frontend"
npm install
npm install react-leaflet leaflet socket.io-client
npm start
```

**Wait for:** `Compiled successfully!`

**Browser opens automatically to:** http://localhost:3000

---

## ✅ What You Should See

### **Home Page:**
- Relief-Net logo at top
- "Relief-Net" title
- "Decentralized disaster resource sharing platform"
- "Get Started" and "Login" buttons
- Features section
- Footer with email

### **If You See This = SUCCESS!** ✅

---

## 🐛 Troubleshooting

### **Blank White Screen:**
- Missing dependencies → Run `npm install react-leaflet leaflet`
- Build error → Check terminal for red errors
- Port conflict → Kill process on port 3000

### **"Cannot GET /" Error:**
- Wrong URL → Use http://localhost:3000
- Server not started → Run `npm start`

### **Console Errors:**
- Share the exact error message
- I'll help you fix it

---

## 📦 Required Dependencies

### **Frontend package.json should include:**
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-leaflet": "^4.x",
    "leaflet": "^1.9.x",
    "socket.io-client": "^4.x",
    "axios": "^1.x"
  }
}
```

### **If any missing, install:**
```bash
npm install react-leaflet leaflet socket.io-client axios
```

---

## 🎯 Quick Test

After starting, open browser console (F12) and type:
```javascript
console.log('Relief-Net loaded!');
```

If you see the message, React is working!

---

## 💡 Nuclear Option (If Nothing Works)

Complete fresh install:

```bash
# Delete everything and reinstall
cd disaster-resource-frontend
rm -rf node_modules package-lock.json
npm install
npm install react react-dom react-leaflet leaflet socket.io-client axios
npm start
```

---

## 📞 Still Stuck?

**Email:** aaswathyachu123@gmail.com

**Share:**
1. Screenshot of blank screen
2. Browser console errors (F12 → Console)
3. Terminal output from `npm start`

---

**Run the install commands above and the blank screen will be fixed!** 🚀
