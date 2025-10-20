# 🔧 Task Cards Not Showing - Troubleshooting

## ❓ Why Task Cards Might Not Appear

---

## 1️⃣ **No Tasks Assigned Yet**

### Most Common Reason:
You might not have any delivery tasks assigned to your volunteer account yet.

### How to Create Tasks:
1. **Login as Donor** → Add a resource
2. **Login as Requester** → Submit a request for that resource
3. **System automatically assigns** → Volunteer gets task
4. **Login as Volunteer** → You should see the task card

---

## 2️⃣ **Backend Not Running**

### Check if backend is running:
```bash
cd disaster-resource-backend
npm run dev
```

**Should see:**
```
✓ MongoDB connected
✓ Server running on port 5001
✓ Socket.IO initialized
```

---

## 3️⃣ **Database Issue**

### Fix the database:
```bash
cd disaster-resource-backend
node fixExistingTasks.js
```

Then restart backend:
```bash
npm run dev
```

---

## 4️⃣ **Check Browser Console**

1. Press **F12** (DevTools)
2. Go to **Console** tab
3. Look for errors

### Common Errors:
- `Failed to fetch` → Backend not running
- `Network Error` → Wrong port
- `404 Not Found` → API endpoint issue

---

## ✅ **How to Test Task Cards**

### Complete Workflow:

#### **Step 1: Create Resource (as Donor)**
1. Register/Login as Donor
2. Click "Add Resource"
3. Fill form:
   - Type: Food
   - Quantity: 10
   - Description: Rice bags
4. Submit

#### **Step 2: Create Request (as Requester)**
1. Register/Login as Requester  
2. Click "Submit Request"
3. Fill form:
   - Type: Food
   - Quantity: 10
   - Urgency: High
4. Submit

#### **Step 3: System Matches**
- Backend automatically matches request with resource
- Finds nearest available volunteer
- Creates delivery task
- Sends notification via Socket.IO

#### **Step 4: View Task (as Volunteer)**
1. Login as Volunteer
2. Set status to "Available"
3. You should see task card:
```
┌────────────────────────────────┐
│ Food - 10 units                │
│ [assigned] [high priority]     │
│ Pickup: John | Deliver: Mary   │
│ [✓ Accept Task]                │
└────────────────────────────────┘
```

---

## 🔍 **Debug Checklist**

- [ ] Backend running on port 5001
- [ ] Frontend running on port 3000
- [ ] MongoDB connected
- [ ] Logged in as Volunteer
- [ ] Volunteer status set to "Available"
- [ ] At least one resource added (by donor)
- [ ] At least one request submitted (by requester)
- [ ] Request matches resource type
- [ ] No console errors in browser

---

## 📊 **Check if Tasks Exist**

### In Browser Console:
```javascript
// Check if tasks are being fetched
fetch('http://localhost:5001/api/delivery-tasks', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
})
.then(r => r.json())
.then(data => console.log('Tasks:', data));
```

---

## 🎯 **Expected Behavior**

### When Tasks Exist:
- Statistics show counts (New: 2, In Progress: 1, etc.)
- Task cards appear below statistics
- Each card shows resource details
- Action buttons visible based on status

### When No Tasks:
- Statistics show 0
- Empty state message:
  ```
  📦
  No Tasks Yet
  Stay available to receive delivery task assignments
  ```

---

## 💡 **Quick Fix**

### If cards still don't show:

1. **Clear browser cache:**
   - Ctrl + Shift + Delete
   - Clear cached images and files

2. **Restart everything:**
```bash
# Kill all terminals
# Then restart:

# Terminal 1 - Backend
cd disaster-resource-backend
npm run dev

# Terminal 2 - Frontend  
cd disaster-resource-frontend
npm start
```

3. **Check network tab:**
   - F12 → Network tab
   - Look for `/api/delivery-tasks` request
   - Check response

---

## 🔧 **Still Not Working?**

### Share these details:
1. Browser console errors (F12 → Console)
2. Network tab response (F12 → Network)
3. Backend terminal output
4. Are you logged in as Volunteer?
5. Is availability set to "Available"?
6. Do you see the statistics cards?

---

**Most likely: You just need to create a resource and request first!** 📦

Last Updated: October 5, 2025
