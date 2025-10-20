# 🔧 Troubleshooting: Resources Not Showing

## Issue: Added resources but nothing appears in Donor Dashboard

### ✅ What I Fixed

I updated the `fetchResources` function in `DonorDashboard.jsx` to handle different donor ID formats and added console logging for debugging.

---

## 🔍 How to Debug

### Step 1: Open Browser Console
1. Open your app in browser
2. Press **F12** (or right-click → Inspect)
3. Go to **Console** tab
4. Login as Donor

### Step 2: Check Console Logs
You should see:
```
All resources: [array of resources]
Current user ID: your_user_id
My resources: [filtered array]
```

### Step 3: Verify the Data

#### Check if resources exist:
- Look at "All resources" in console
- If empty `[]`, no resources in database
- If has data, resources exist

#### Check user ID matching:
- Look at "Current user ID"
- Compare with donor IDs in "All resources"
- They should match

---

## 🐛 Common Issues & Solutions

### Issue 1: Resources exist but not showing
**Cause:** User ID mismatch  
**Solution:** The fix I applied handles both `user.id` and `user._id`

**Check in console:**
```javascript
// Your user object
console.log('User:', user);

// Resource donor IDs
resources.forEach(r => console.log('Donor ID:', r.donor));
```

### Issue 2: No resources in database
**Cause:** Resources not actually saved  
**Solution:** 
1. Check backend console for errors
2. Verify MongoDB connection
3. Try adding resource again

### Issue 3: Backend not returning resources
**Cause:** API endpoint issue  
**Solution:**
1. Check backend is running on port 5001
2. Test endpoint: `http://localhost:5001/resources`
3. Check authentication token

---

## 🧪 Manual Testing

### Test 1: Check Backend Directly
Open new browser tab:
```
http://localhost:5001/resources
```
**Expected:** JSON array of resources (might need auth)

### Test 2: Check Network Tab
1. Open DevTools → Network tab
2. Reload Donor Dashboard
3. Look for request to `/resources`
4. Check:
   - Status: 200 OK
   - Response: Array of resources
   - Headers: Authorization token present

### Test 3: Add Resource with Console Open
1. Open Console (F12)
2. Fill form and click "Add Resource"
3. Watch for:
   - "Resource added successfully!" alert
   - Console logs showing new resource
   - Page refresh with updated list

---

## 🔧 Quick Fixes

### Fix 1: Clear and Re-login
```bash
# In browser console
localStorage.clear()
# Then login again
```

### Fix 2: Restart Backend
```bash
cd disaster-resource-backend
# Stop server (Ctrl+C)
npm run dev
```

### Fix 3: Check User Object
```javascript
// In browser console
const user = JSON.parse(localStorage.getItem('user'));
console.log('User ID:', user.id);
console.log('User _ID:', user._id);
```

---

## 📋 Checklist

Before reporting issue, verify:
- [ ] Backend is running (port 5001)
- [ ] Frontend is running (port 3000)
- [ ] MongoDB is connected
- [ ] You're logged in as Donor
- [ ] Token exists in localStorage
- [ ] Console shows no errors
- [ ] Network tab shows 200 OK responses

---

## 🎯 Expected Behavior

### When you add a resource:
1. Form submits
2. Alert: "Resource added successfully!"
3. Form clears
4. `fetchResources()` runs
5. Console logs appear
6. Resource appears in "My Resources" section
7. Statistics update (Total, Available, Delivered)

### Resource Card Should Show:
```
┌─────────────────────────────────┐
│ Food                 [available]│
│ Quantity: 50                    │
│ Description: Rice bags...       │
│ Added: 10/6/2025                │
└─────────────────────────────────┘
```

---

## 🔍 What to Check in Console

### Good Output:
```javascript
All resources: [
  {
    _id: "...",
    type: "Food",
    quantity: 50,
    donor: "your_user_id",  // or { _id: "your_user_id", name: "..." }
    status: "available",
    createdAt: "2025-10-06..."
  }
]
Current user ID: your_user_id
My resources: [
  { _id: "...", type: "Food", ... }
]
```

### Bad Output (Issue):
```javascript
All resources: []  // Empty - no resources in DB
Current user ID: your_user_id
My resources: []  // Empty - filtering failed
```

---

## 🚀 After My Fix

The updated code now:
1. ✅ Handles both `r.donor._id` and `r.donor` formats
2. ✅ Checks both `user.id` and `user._id`
3. ✅ Logs everything for debugging
4. ✅ Shows clear console output

---

## 📞 If Still Not Working

### Provide this info:
1. **Console output** (copy all logs)
2. **Network tab** (screenshot of /resources request)
3. **User object** (from localStorage)
4. **Backend console** (any errors?)

### Quick Test:
```javascript
// Run in browser console
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

fetch('http://localhost:5001/resources', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(r => r.json())
.then(data => {
  console.log('All resources:', data);
  console.log('User ID:', user.id || user._id);
  console.log('Match:', data.filter(r => {
    const donorId = r.donor?._id || r.donor;
    return donorId === user.id || donorId === user._id;
  }));
});
```

---

**Your resources should now appear! Check the console logs to see what's happening.** 🔍✅
