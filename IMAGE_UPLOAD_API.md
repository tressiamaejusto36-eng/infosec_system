# Room Image Upload API Documentation

## 🖼️ Image Upload Endpoints

### 1. Upload Room Images (Admin Only)

**POST** `/api/rooms/:id/images`

Upload multiple images for a specific room.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: multipart/form-data
```

**Parameters:**
- `id` (URL parameter) - Room ID (MongoDB ObjectId)

**Body:**
- `images` (files) - Array of image files (max 5 files, 5MB each)

**Supported formats:** JPEG, JPG, PNG, WebP

**Example using curl:**
```bash
curl -X POST \
  http://localhost:5000/api/rooms/ROOM_ID/images \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "images=@room1.jpg" \
  -F "images=@room2.jpg"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Images uploaded successfully.",
  "data": {
    "images": [
      "/uploads/rooms/ROOM_ID_1234567890-123456789.jpg",
      "/uploads/rooms/ROOM_ID_1234567890-987654321.jpg"
    ],
    "uploadedCount": 2
  }
}
```

**Error Responses:**
```json
// File too large
{
  "success": false,
  "message": "File too large. Maximum size is 5MB."
}

// Too many files
{
  "success": false,
  "message": "Too many files. Maximum 5 images allowed."
}

// Invalid file type
{
  "success": false,
  "message": "Only image files (JPEG, JPG, PNG, WebP) are allowed!"
}
```

---

### 2. Delete Room Image (Admin Only)

**DELETE** `/api/rooms/:id/images`

Delete a specific image from a room.

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

**Parameters:**
- `id` (URL parameter) - Room ID (MongoDB ObjectId)

**Body:**
```json
{
  "imageUrl": "/uploads/rooms/ROOM_ID_1234567890-123456789.jpg"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Image deleted successfully.",
  "data": {
    "images": [
      "/uploads/rooms/ROOM_ID_1234567890-987654321.jpg"
    ]
  }
}
```

---

### 3. View Uploaded Images

**GET** `/uploads/rooms/filename.jpg`

Access uploaded images directly via URL.

**Example:**
```
http://localhost:5000/uploads/rooms/ROOM_ID_1234567890-123456789.jpg
```

---

## 🛠️ Frontend Integration

### JavaScript Example (Admin Panel)

```javascript
// Upload images
const uploadImages = async (roomId, files) => {
  const formData = new FormData();
  
  // Add multiple files
  for (let i = 0; i < files.length; i++) {
    formData.append('images', files[i]);
  }

  try {
    const response = await api.post(`/rooms/${roomId}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('Upload successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Upload failed:', error.response?.data);
    throw error;
  }
};

// Delete image
const deleteImage = async (roomId, imageUrl) => {
  try {
    const response = await api.delete(`/rooms/${roomId}/images`, {
      data: { imageUrl }
    });
    
    console.log('Delete successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Delete failed:', error.response?.data);
    throw error;
  }
};
```

### React Component Example

```jsx
import { useState } from 'react';

function ImageUpload({ roomId }) {
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState([]);

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const result = await uploadImages(roomId, files);
      setImages(prev => [...prev, ...result.data.images]);
      toast.success(`${result.data.uploadedCount} images uploaded!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileUpload}
        disabled={uploading}
      />
      
      <div className="image-grid">
        {images.map((imageUrl, index) => (
          <div key={index} className="image-item">
            <img 
              src={`http://localhost:5000${imageUrl}`} 
              alt={`Room ${index + 1}`}
            />
            <button onClick={() => deleteImage(roomId, imageUrl)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔒 Security Features

### File Validation
- ✅ **File type restriction** - Only image formats allowed
- ✅ **File size limit** - 5MB maximum per file
- ✅ **File count limit** - Maximum 5 images per room
- ✅ **Admin-only access** - Requires admin JWT token

### Storage Security
- ✅ **Unique filenames** - Prevents conflicts and overwrites
- ✅ **Path traversal protection** - Files stored in designated directory
- ✅ **Automatic cleanup** - Files deleted when room is deleted
- ✅ **Error handling** - Failed uploads are cleaned up

---

## 📁 File Structure

```
backend/
├── uploads/
│   └── rooms/
│       ├── ROOM_ID_timestamp_filename.jpg
│       └── ROOM_ID_timestamp_filename.png
├── middlewares/
│   └── upload.js
└── controllers/
    └── roomController.js (updated)
```

---

## 🚀 Getting Started

1. **Seed sample rooms:**
   ```bash
   cd backend
   node seedRooms.js
   ```

2. **Test image upload:**
   - Login as admin
   - Get admin JWT token
   - Use the API endpoints above

3. **View images:**
   - Access via: `http://localhost:5000/uploads/rooms/filename.jpg`
   - Or integrate into your frontend components

---

## 📝 Notes

- Images are stored locally in `backend/uploads/rooms/`
- For production, consider using cloud storage (AWS S3, Cloudinary, etc.)
- The Room schema already includes the `images` array field
- Sample rooms include placeholder images from Unsplash
- All endpoints require admin authentication
- Files are automatically cleaned up on errors or room deletion