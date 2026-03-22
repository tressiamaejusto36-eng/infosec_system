# Image Upload & Display Troubleshooting Guide

## Issue Fixed

The main issue was that the `basePrice` field was marked as required in the Room model, but the frontend wasn't sending it. This caused room creation/updates to fail silently.

### What Was Fixed:
1. Made `basePrice` optional in Room model
2. Auto-set `basePrice = price` in createRoom controller
3. Auto-set `basePrice = price` in updateRoom controller

---

## How Images Work

### Upload Flow:
1. Admin selects images in the admin panel
2. Images are sent via FormData to `POST /api/rooms/:id/images`
3. Multer middleware saves files to `backend/uploads/rooms/`
4. Filenames are generated as: `{roomId}_{timestamp}-{random}.jpg`
5. Image URLs are saved to database as: `/uploads/rooms/filename.jpg`
6. Room document is updated with image URLs array

### Display Flow:
1. Frontend fetches room data with images array
2. Images are displayed using: `http://localhost:5000${imageUrl}`
3. Express serves static files from `backend/uploads/` directory

---

## Testing Image Upload

### 1. Check if uploads directory exists:
```bash
ls -la backend/uploads/rooms/
```

### 2. Test image upload via API:
```bash
curl -X POST http://localhost:5000/api/rooms/ROOM_ID/images \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

### 3. Test image serving:
```bash
# Get a room to see its images
curl http://localhost:5000/api/rooms/ROOM_ID

# Try to access an image directly
curl http://localhost:5000/uploads/rooms/FILENAME.jpg --output test.jpg
```

### 4. Check browser console:
- Open DevTools (F12)
- Go to Network tab
- Try to load a room with images
- Check if image requests return 200 or 404

---

## Common Issues & Solutions

### Issue 1: Images upload but don't display
**Symptoms:** Upload succeeds, but images show broken icon

**Possible Causes:**
- Static file serving not configured
- Wrong image URL format in database
- CORS issues

**Solutions:**
```javascript
// Verify in server.js:
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Check image URLs in database (should be):
"/uploads/rooms/filename.jpg"

// NOT:
"uploads/rooms/filename.jpg"  // Missing leading slash
"http://localhost:5000/uploads/rooms/filename.jpg"  // Full URL
```

### Issue 2: Upload fails with validation error
**Symptoms:** "Base price is required" or similar error

**Solution:** Already fixed! The basePrice is now auto-set from price.

### Issue 3: Images don't refresh after upload
**Symptoms:** Upload succeeds but images don't appear until page refresh

**Solution:** The AdminPanel already calls `fetchRooms()` after upload. If still not working:
```javascript
// In AdminPanel.jsx, after upload:
fetchRooms();
// And update editingRoom state:
setEditingRoom(prev => ({
  ...prev,
  images: response.data.data.images
}));
```

### Issue 4: File size too large
**Symptoms:** Upload fails with "File too large" error

**Solution:** Check multer configuration in `backend/middlewares/upload.js`:
```javascript
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});
```

### Issue 5: Wrong file permissions
**Symptoms:** Images upload but can't be accessed (403 Forbidden)

**Solution (Linux/Mac):**
```bash
chmod -R 755 backend/uploads/
```

**Solution (Windows):**
- Right-click `backend/uploads` folder
- Properties → Security → Edit
- Give "Read & Execute" permissions to Users

---

## Verify Everything Works

### Step 1: Run Migration
```bash
cd backend
node migrateRoomPrices.js
```

### Step 2: Check Existing Rooms
```bash
# Start the server
npm start

# In another terminal, check rooms:
curl http://localhost:5000/api/rooms
```

### Step 3: Test Upload in Admin Panel
1. Login as admin
2. Go to Admin Panel → Rooms tab
3. Click "Add Room" or edit existing room
4. Fill in room details
5. Select 1-5 images
6. Click "Upload Selected Images"
7. Check if images appear in the preview

### Step 4: Test Display on User Side
1. Logout or open incognito window
2. Go to Rooms page
3. Check if room images are displayed
4. Click on a room to see details
5. Verify image carousel works

---

## Debug Checklist

- [ ] Backend server is running on port 5000
- [ ] Frontend is running on port 5173
- [ ] `backend/uploads/rooms/` directory exists
- [ ] Static file serving is configured in server.js
- [ ] Room has `basePrice` field (or it's auto-set)
- [ ] Images array in database has correct format: `["/uploads/rooms/file.jpg"]`
- [ ] Browser console shows no 404 errors for images
- [ ] Network tab shows image requests returning 200 OK

---

## Image URL Formats

### ✅ Correct Formats:

**In Database:**
```json
{
  "images": [
    "/uploads/rooms/65f123_1234567890-123.jpg",
    "/uploads/rooms/65f123_1234567891-456.jpg"
  ]
}
```

**In Frontend:**
```jsx
<img src={`http://localhost:5000${room.images[0]}`} />
// Results in: http://localhost:5000/uploads/rooms/65f123_1234567890-123.jpg
```

### ❌ Incorrect Formats:

**Missing leading slash:**
```json
{
  "images": ["uploads/rooms/file.jpg"]  // Wrong!
}
```

**Full URL in database:**
```json
{
  "images": ["http://localhost:5000/uploads/rooms/file.jpg"]  // Wrong!
}
```

**Wrong frontend construction:**
```jsx
<img src={room.images[0]} />  // Wrong! Missing base URL
```

---

## Production Considerations

When deploying to production:

1. **Use CDN for images:**
   - Upload to AWS S3, Cloudinary, or similar
   - Store full URLs in database
   - Update frontend to use URLs directly

2. **Environment-based URLs:**
   ```javascript
   const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
   <img src={`${API_URL}${room.images[0]}`} />
   ```

3. **Image optimization:**
   - Compress images before upload
   - Generate thumbnails
   - Use WebP format
   - Implement lazy loading

4. **Security:**
   - Validate file types strictly
   - Scan for malware
   - Limit file sizes
   - Use signed URLs for sensitive images

---

## Quick Fix Commands

### Reset uploads directory:
```bash
rm -rf backend/uploads/rooms/*
mkdir -p backend/uploads/rooms
```

### Check what's in database:
```bash
# Using MongoDB shell
mongosh
use securestay
db.rooms.find({}, { roomNumber: 1, images: 1 })
```

### Clear all room images:
```bash
# Using MongoDB shell
mongosh
use securestay
db.rooms.updateMany({}, { $set: { images: [] } })
```

---

## Still Not Working?

1. **Check server logs** - Look for upload errors
2. **Check browser console** - Look for 404 or CORS errors
3. **Verify file exists** - Check `backend/uploads/rooms/` directory
4. **Test direct URL** - Try accessing image URL directly in browser
5. **Check permissions** - Ensure uploads directory is readable
6. **Restart server** - Sometimes static file serving needs a restart

---

## Success Indicators

✅ Upload shows "Images uploaded successfully" toast
✅ Images appear in admin panel preview
✅ Images appear on user-facing room cards
✅ Image carousel works on room details page
✅ Network tab shows 200 OK for image requests
✅ No console errors related to images

---

**The basePrice issue has been fixed. Images should now upload and display correctly!**
