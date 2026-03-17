# Room Images Troubleshooting Guide

## 🚨 Issue: Images Not Saved in Database

If room images are not being saved to the database, follow these troubleshooting steps:

### 🔧 Step 1: Create Uploads Directory
First, ensure the uploads directory exists:

```bash
cd backend
node createUploadsDir.js
```

### 🔍 Step 2: Debug the System
Run the debug script to check all components:

```bash
cd backend
node debugImageUpload.js
```

This will check:
- MongoDB connection
- Uploads directory existence
- Room model structure
- Database save/retrieve functionality

### 🖼️ Step 3: Test Image Upload Process

1. **Start both servers with debug logging**:
   ```bash
   # Backend (will show detailed upload logs)
   cd backend
   npm start

   # Frontend
   cd client
   npm run dev
   ```

2. **Open browser developer tools** (F12) and go to Console tab

3. **Login as admin** and go to Admin Panel → Rooms

4. **Try uploading images**:
   - Create a new room OR edit existing room
   - Select 1-2 small image files (< 1MB each)
   - Watch console logs in both browser and backend terminal

### 🔍 Step 4: Check Debug Output

**Backend Console Should Show**:
```
🖼️ Image upload request received for room: [ROOM_ID]
📁 Files received: [NUMBER]
✅ Room found: [ROOM_NUMBER] Current images: [COUNT]
📄 Generated URL: /uploads/rooms/[FILENAME] for file: [FILENAME]
📋 Updated images array: [ARRAY]
✅ Room saved with images
```

**Frontend Console Should Show**:
```
🖼️ Starting image upload for room: [ROOM_ID]
📁 Selected images: [FILE_INFO]
📤 Sending upload request to: /rooms/[ROOM_ID]/images
✅ Upload response: [RESPONSE_DATA]
```

### 🚨 Common Issues & Solutions

#### Issue 1: "No files in request"
**Cause**: Multer middleware not receiving files
**Solutions**:
- Check if uploads directory exists: `node createUploadsDir.js`
- Verify file types are supported (JPEG, PNG, WebP only)
- Check file sizes (max 5MB each)

#### Issue 2: "Room not found"
**Cause**: Invalid room ID or room doesn't exist
**Solutions**:
- Verify room was created successfully first
- Check room ID in database
- Try with existing room instead of new room

#### Issue 3: "Invalid room ID format"
**Cause**: Room ID is not a valid MongoDB ObjectId
**Solutions**:
- Check if room creation succeeded
- Verify room ID is being passed correctly

#### Issue 4: Files uploaded but not in database
**Cause**: Database save failed after file upload
**Solutions**:
- Check MongoDB connection
- Verify room model has `images` field
- Check for database validation errors

#### Issue 5: Images in database but not displaying
**Cause**: Frontend not reading images correctly
**Solutions**:
- Check if images array exists in room data
- Verify image URLs are correct format
- Check if static file serving is working

### 🔧 Manual Database Check

Connect to your MongoDB and check if images are saved:

```javascript
// In MongoDB Compass or CLI
db.rooms.find({}, { roomNumber: 1, images: 1 })
```

Should show:
```javascript
{
  "_id": ObjectId("..."),
  "roomNumber": "101",
  "images": [
    "/uploads/rooms/ROOM_ID_timestamp_filename.jpg"
  ]
}
```

### 📁 File System Check

Check if files are actually uploaded:

```bash
# Windows
dir backend\uploads\rooms

# Mac/Linux  
ls -la backend/uploads/rooms/
```

Should show uploaded image files with names like:
`ROOM_ID_1234567890_filename.jpg`

### 🌐 Network Check

1. Open browser DevTools → Network tab
2. Try uploading images
3. Look for:
   - POST request to `/api/rooms/[ID]/images`
   - Response should be 200 with success message
   - Check if any requests are failing

### 🎯 Quick Fix Checklist

- [ ] Uploads directory exists (`node createUploadsDir.js`)
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 5173
- [ ] MongoDB connected and accessible
- [ ] Admin user logged in with correct permissions
- [ ] Image files are valid format and size
- [ ] Browser console shows no JavaScript errors
- [ ] Backend console shows upload debug messages

### 🆘 Still Not Working?

If images are still not saving after following all steps:

1. **Check the exact error messages** in both frontend and backend consoles
2. **Try with a single small image** (< 500KB) first
3. **Test with an existing room** instead of creating new one
4. **Verify the API endpoint** is accessible: `GET http://localhost:5000/api/health`
5. **Check database permissions** and connection string

### 📞 Debug Commands Summary

```bash
# Setup
cd backend
node createUploadsDir.js
node debugImageUpload.js

# Test database setup
node setupDatabase.js

# Check if backend is running
curl http://localhost:5000/api/health
```

The debug logging will help identify exactly where the process is failing!