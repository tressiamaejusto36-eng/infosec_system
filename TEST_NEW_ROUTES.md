# Testing New Routes

## The Problem

The housekeeping and pricing features are showing "Failed to load" errors because the backend server needs to be restarted to register the new routes.

## Solution

**Restart the backend server:**

```bash
# Stop the current server (Ctrl+C in the terminal running the backend)
# Then restart:
cd backend
npm start
```

## Verify Routes Are Working

After restarting, test the routes:

### 1. Test Housekeeping Route
```bash
curl http://localhost:5000/api/housekeeping \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Expected: `{"success":true,"data":[]}`

### 2. Test Pricing Route
```bash
curl http://localhost:5000/api/pricing \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Expected: `{"success":true,"data":[]}`

### 3. Test Rooms Route (should already work)
```bash
curl http://localhost:5000/api/rooms
```

Expected: List of 4 rooms

## If Routes Still Don't Work

Check the server console for errors when it starts. You should see:
```
✅ SecureStay server running on port 5000
```

If you see route registration errors, the issue is with the route files.

## Quick Fix Steps

1. **Stop backend server** (Ctrl+C)
2. **Restart backend server**:
   ```bash
   cd backend
   npm start
   ```
3. **Refresh browser** (Ctrl+Shift+R)
4. **Go to Admin Panel → Housekeeping tab**
5. **Click "New Task"**
6. **You should now see 4 rooms in the dropdown**

## Troubleshooting

### If rooms dropdown is still empty:

1. Check browser console (F12) for errors
2. Check Network tab - look for failed API calls
3. Verify backend is running on port 5000
4. Test the rooms API directly: `http://localhost:5000/api/rooms`

### If you see 404 errors:

The routes aren't registered. Check `backend/server.js` has:
```javascript
app.use("/api/housekeeping", housekeepingRoutes);
app.use("/api/pricing", pricingRoutes);
```

### If you see 401/403 errors:

You're not logged in as admin. Make sure you're logged in with an admin account.

## Expected Behavior After Fix

1. **Housekeeping Tab**:
   - Shows statistics (0 pending, 0 in progress, etc.)
   - "New Task" button works
   - Room dropdown shows 4 rooms
   - Can create tasks successfully

2. **Pricing Tab**:
   - Shows empty table (no rules yet)
   - "New Rule" button works
   - Can create pricing rules

3. **Check-In/Out Tab**:
   - Shows dashboard with 0 guests (if no reservations)
   - Tables are empty but functional

## The Root Cause

When you add new routes to an Express.js server, they're only registered when the server starts. Since we added:
- `/api/housekeeping` routes
- `/api/pricing` routes

These routes don't exist until the server restarts and runs the `app.use()` statements that register them.

**Simply restart the backend server and everything will work!**
