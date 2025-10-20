# 🔧 Fix Socket.IO Error - Quick Solution

## ❌ Error
```
Module not found: Error: Can't resolve 'socket.io-client'
```

## ✅ Solution

### **Step 1: Stop Frontend**
Press `Ctrl + C` in the terminal running frontend

### **Step 2: Install Dependencies**

Open Command Prompt and run:

```cmd
cd "d:\Decentralized disaster resource sharing app\disaster-resource-frontend"
npm install
```

This will install:
- axios
- socket.io-client

### **Step 3: Restart Frontend**

```cmd
npm start
```

---

## 🎯 What This Does

The `npm install` command will read the updated `package.json` and install:
- `socket.io-client@^4.5.0` - For real-time notifications in VolunteerDashboard
- `axios@^1.6.0` - For API calls (if not already installed)

---

## ✅ After Installation

Your app will compile successfully and you'll be able to:
- ✅ Use VolunteerDashboard
- ✅ Receive real-time notifications
- ✅ See all features working

---

**Run `npm install` now and restart!** 🚀
