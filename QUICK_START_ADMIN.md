# 🚀 Quick Start - Admin Dashboard

## ⚡ 5-Minute Setup

### **Step 1: Install Dependencies**

**Backend:**
```bash
cd disaster-resource-backend
npm install
```

**Frontend:**
```bash
cd disaster-resource-frontend
npm install
```

### **Step 2: Configure Backend**

Create `.env` file in `disaster-resource-backend/`:
```env
PORT=5001
MONGO_URI=mongodb+srv://your_username:your_password@cluster.mongodb.net/disasterDB
JWT_SECRET=your_secret_key_here
```

### **Step 3: Create Admin User**

```bash
cd disaster-resource-backend
node createAdmin.js
```

**Output:**
```
✅ Admin user created successfully!

Login credentials:
Email: admin@test.com
Password: admin123
```

### **Step 4: Start Backend**

```bash
cd disaster-resource-backend
npm run dev
```

**Expected Output:**
```
Server running on port 5001
MongoDB Connected
```

### **Step 5: Start Frontend**

Open a new terminal:
```bash
cd disaster-resource-frontend
npm start
```

**Expected Output:**
```
Compiled successfully!
Local: http://localhost:3000
```

### **Step 6: Login**

1. Open browser: `http://localhost:3000`
2. Enter credentials:
   - Email: `admin@test.com`
   - Password: `admin123`
3. Click **Login**

---

## 🎯 What You'll See

### **Admin Dashboard Tabs:**

1. **📊 Overview**
   - System statistics
   - User counts
   - Resource metrics
   - Top volunteers

2. **👥 User Management**
   - Approve/reject users
   - View all users
   - Activate/deactivate accounts

3. **📦 Resource Oversight**
   - Monitor all resources
   - Track donor information
   - View resource status

4. **🚚 Delivery Monitoring**
   - Track all deliveries
   - Monitor volunteer performance
   - View delivery status

5. **⚖️ Dispute Resolution**
   - View disputes
   - Resolve issues
   - Track resolution history

---

## 🔧 Common Actions

### **Approve a New User**
1. Go to **User Management** tab
2. Filter by status: **Pending**
3. Click **✓ Approve**

### **Resolve a Dispute**
1. Go to **Dispute Resolution** tab
2. Click **✓ Resolve Dispute**
3. Enter resolution notes
4. Submit

### **Monitor Deliveries**
1. Go to **Delivery Monitoring** tab
2. View all active deliveries
3. Check status and progress

---

## 📱 Test the System

### **Create Test Users**

Use the registration endpoint or create directly in MongoDB:

**Donor:**
```json
{
  "name": "John Donor",
  "email": "donor@test.com",
  "password": "donor123",
  "role": "donor",
  "location": "76.65,10.78"
}
```

**Requester:**
```json
{
  "name": "Jane Requester",
  "email": "requester@test.com",
  "password": "requester123",
  "role": "requester",
  "location": "76.70,10.80"
}
```

**Volunteer:**
```json
{
  "name": "Mike Volunteer",
  "email": "volunteer@test.com",
  "password": "volunteer123",
  "role": "volunteer",
  "location": "76.67,10.79"
}
```

Then **approve them** in the Admin Dashboard!

---

## 🐛 Troubleshooting

### Backend won't start?
- Check MongoDB connection string in `.env`
- Ensure port 5001 is available
- Run `npm install` again

### Frontend errors?
- Run `npm install` to install axios
- Clear browser cache
- Check console for errors

### Can't login?
- Ensure backend is running
- Run `node createAdmin.js` again
- Check credentials: `admin@test.com` / `admin123`

---

## 📚 Full Documentation

- **[ADMIN_SETUP_GUIDE.md](./ADMIN_SETUP_GUIDE.md)** - Complete admin guide
- **[README.md](./README.md)** - Project overview
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Technical details

---

## ✅ You're Ready!

Your admin dashboard is now fully functional with:

✅ User management with approval workflow  
✅ Resource oversight and monitoring  
✅ Delivery tracking and performance metrics  
✅ Dispute resolution system  
✅ Comprehensive analytics dashboard  

**Start managing your disaster resource platform!** 🎉

---

*Need help? Check the full documentation or review backend logs.*
