# Admin Panel Setup & Troubleshooting Guide

## 🚀 Quick Setup

### 1. Create Admin User
First, create an admin user to access the admin panel:

```bash
cd backend
node create-admin.js
```

This creates an admin user with:
- Email: `dumasmackie@gmail.com`
- Password: `dimahack123`

### 2. Setup Database with Sample Data
Run the complete database setup to populate rooms, reservations, and inventory:

```bash
cd backend
node setupDatabase.js
```

This will create:
- 6 sample rooms (Standard, Deluxe, Suite, Presidential)
- 15 sample reservations for analytics
- 6 sample inventory items
- Summary of created data

### 3. Alternative: Individual Seeders
If you prefer to run seeders individually:

```bash
# Seed rooms first
node seedRooms.js

# Seed inventory (requires rooms)
node seedInventory.js

# Seed reservations (requires users and rooms)
node seedReservations.js
```

## 🔧 Troubleshooting Analytics & Inventory Issues

### Common Issues & Solutions

#### 1. **"Failed to load analytics" Error**

**Possible Causes:**
- No reservation data in database
- User not authenticated as admin
- Backend server not running

**Solutions:**
```bash
# Check if you have reservation data
# In MongoDB Compass or CLI, check if 'reservations' collection has data

# Run database setup to create sample data
node setupDatabase.js

# Verify admin user exists and has correct role
node create-admin.js
```

#### 2. **"Failed to load inventory" Error**

**Possible Causes:**
- No inventory data in database
- Missing room data (inventory requires rooms)

**Solutions:**
```bash
# Setup complete database
node setupDatabase.js

# Or seed inventory specifically
node seedInventory.js
```

#### 3. **"Access denied. Admin privileges required" Error**

**Possible Causes:**
- User logged in as regular user, not admin
- Token expired or invalid

**Solutions:**
1. Logout and login with admin credentials:
   - Email: `dumasmackie@gmail.com`
   - Password: `dimahack123`

2. Check browser console for authentication errors

3. Verify admin user exists:
```bash
node create-admin.js
```

#### 4. **Empty Analytics Dashboard**

**Possible Causes:**
- No reservation data for the selected period
- All reservations are cancelled

**Solutions:**
1. Change the analytics period (7, 30, 90 days)
2. Create sample reservations:
```bash
node seedReservations.js
```

### 5. **API Endpoints Not Responding**

**Check these:**
1. Backend server is running on port 5000
2. Frontend is running on port 5173
3. CORS is configured correctly
4. MongoDB connection is active

```bash
# Test backend health
curl http://localhost:5000/api/health

# Check MongoDB connection in backend logs
```

## 🔍 Debug Mode

The admin panel now includes detailed console logging. Open browser DevTools (F12) and check the Console tab for:

- Authentication status
- API request/response details
- Error messages with specific details

## 📊 Expected Data After Setup

After running `setupDatabase.js`, you should see:

### Analytics Tab:
- Total Revenue: ~$3,000-5,000
- Occupancy Rate: 15-25%
- Total Bookings: 10-15
- Room type performance data

### Inventory Tab:
- 6+ inventory items
- Total inventory value: ~$4,000-6,000
- Items across different categories
- Low stock alerts (if any)

### Users Tab:
- Admin user + any registered users
- Role management functionality

### Reservations Tab:
- 15 sample reservations
- Various statuses (confirmed, completed, cancelled, pending)
- Guest and room information

## 🛠️ Manual Database Check

If issues persist, manually check your database:

### Using MongoDB Compass:
1. Connect to your MongoDB instance
2. Check these collections have data:
   - `users` (should have admin user)
   - `rooms` (should have 6 rooms)
   - `reservations` (should have 15+ reservations)
   - `inventories` (should have 6+ items)

### Using MongoDB CLI:
```javascript
// Connect to your database
use your_database_name

// Check collections
db.users.countDocuments()
db.rooms.countDocuments()
db.reservations.countDocuments()
db.inventories.countDocuments()

// Check admin user
db.users.findOne({role: "admin"})
```

## 📞 Still Having Issues?

1. **Check browser console** for detailed error messages
2. **Check backend logs** for server-side errors
3. **Verify environment variables** in `.env` files
4. **Test API endpoints** directly using curl or Postman
5. **Ensure MongoDB is running** and accessible

## 🎯 Quick Test Checklist

- [ ] Backend server running (port 5000)
- [ ] Frontend server running (port 5173)
- [ ] MongoDB connected
- [ ] Admin user created
- [ ] Sample data seeded
- [ ] Logged in as admin user
- [ ] Browser console shows no auth errors
- [ ] API calls returning data (check Network tab)

Run through this checklist to identify where the issue might be occurring.