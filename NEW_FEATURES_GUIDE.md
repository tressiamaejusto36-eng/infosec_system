# New Features Guide

This document describes the four new features added to the SecureStay hotel management system.

## 1. Check-in/Check-out System

### Overview
Manage guest arrivals and departures with a comprehensive check-in/check-out tracking system.

### Features
- Track reservation status: `pending`, `confirmed`, `checked-in`, `checked-out`, `cancelled`
- Record actual check-in and check-out times
- Dashboard showing today's arrivals and departures
- Current occupancy tracking
- Automatic room status updates

### API Endpoints

#### Check-in Guest (Admin)
```
PATCH /api/reservations/:id/check-in
```
- Updates reservation status to "checked-in"
- Records check-in time
- Updates room status to "reserved" and housekeeping to "dirty"

#### Check-out Guest (Admin)
```
PATCH /api/reservations/:id/check-out
```
- Updates reservation status to "checked-out"
- Records check-out time
- Updates room status to "cleaning"
- Auto-creates housekeeping task for checkout cleaning

#### Get Check-in/Check-out Dashboard (Admin)
```
GET /api/reservations/dashboard
```
Returns:
- Guests checking in today
- Guests checking out today
- Currently checked-in guests
- Occupancy statistics

### Database Changes
**Reservation Model** - New fields:
- `status`: Added "checked-in" and "checked-out" to enum
- `checkInTime`: Actual check-in timestamp
- `checkOutTime`: Actual check-out timestamp
- `actualCheckInDate`: Actual check-in date
- `actualCheckOutDate`: Actual check-out date

---

## 2. Advanced Search & Filters

### Overview
Powerful search functionality allowing users to find rooms based on multiple criteria.

### Features
- Filter by room type (multiple selection)
- Price range filtering
- Capacity range filtering
- Amenities filtering (must have all selected)
- Date availability checking
- Housekeeping status (admin only)
- Sorting options (price, capacity, room number, etc.)
- Pagination support

### API Endpoint

#### Advanced Room Search
```
GET /api/rooms/search
```

**Query Parameters:**
- `roomType`: Comma-separated room types (Standard,Deluxe,Suite,Presidential)
- `minPrice`: Minimum price per night
- `maxPrice`: Maximum price per night
- `minCapacity`: Minimum guest capacity
- `maxCapacity`: Maximum guest capacity
- `amenities`: Comma-separated amenities (must have all)
- `checkInDate`: ISO date string
- `checkOutDate`: ISO date string
- `housekeepingStatus`: clean, dirty, in-progress, inspected (admin only)
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 12, max: 100)
- `sortBy`: price, capacity, roomNumber, roomType, createdAt
- `sortOrder`: asc or desc

**Example:**
```
GET /api/rooms/search?roomType=Deluxe,Suite&minPrice=100&maxPrice=300&minCapacity=2&amenities=WiFi,TV&checkInDate=2024-03-20&checkOutDate=2024-03-25&sortBy=price&sortOrder=asc
```

**Response:**
```json
{
  "success": true,
  "data": [...rooms],
  "pagination": {
    "total": 45,
    "page": 1,
    "pages": 4,
    "limit": 12
  },
  "filters": {
    "roomType": "Deluxe,Suite",
    "priceRange": { "min": "100", "max": "300" },
    "capacityRange": { "min": "2", "max": null },
    "amenities": ["WiFi", "TV"],
    "dateRange": { "checkIn": "2024-03-20", "checkOut": "2024-03-25" }
  }
}
```

---

## 3. Dynamic Pricing System

### Overview
Flexible pricing rules that automatically adjust room prices based on various factors.

### Features
- Multiple pricing rule types
- Priority-based rule application
- Real-time price calculation
- Bulk price updates

### Pricing Rule Types

1. **Seasonal Pricing**
   - Apply price changes during specific date ranges
   - Example: Summer season, holiday periods

2. **Weekday/Weekend Pricing**
   - Different prices for specific days of the week
   - Example: Higher prices on weekends

3. **Special Event Pricing**
   - Premium pricing during special events
   - Example: Conferences, festivals

4. **Occupancy-Based Pricing**
   - Dynamic pricing based on hotel occupancy rate
   - Example: Higher prices when 80%+ occupied

### API Endpoints

#### Get All Pricing Rules (Admin)
```
GET /api/pricing
```
Query params: `roomType`, `ruleType`, `isActive`

#### Create Pricing Rule (Admin)
```
POST /api/pricing
```
Body:
```json
{
  "name": "Summer Season",
  "roomType": "all",
  "ruleType": "seasonal",
  "startDate": "2024-06-01",
  "endDate": "2024-08-31",
  "priceModifier": 25,
  "priority": 10,
  "isActive": true
}
```

#### Update Pricing Rule (Admin)
```
PUT /api/pricing/:id
```

#### Delete Pricing Rule (Admin)
```
DELETE /api/pricing/:id
```

#### Get Calculated Price for Room (Public)
```
GET /api/pricing/room/:roomId?checkInDate=2024-03-20&checkOutDate=2024-03-25
```
Returns:
```json
{
  "success": true,
  "data": {
    "basePrice": 150,
    "finalPrice": 187.50,
    "modifier": 25
  }
}
```

#### Update All Room Prices (Admin)
```
POST /api/pricing/update-all
```
Recalculates and updates prices for all rooms based on active rules.

### Database Schema

**PricingRule Model:**
```javascript
{
  name: String,
  roomType: "Standard" | "Deluxe" | "Suite" | "Presidential" | "all",
  ruleType: "seasonal" | "weekday" | "weekend" | "special-event" | "occupancy",
  startDate: Date,
  endDate: Date,
  daysOfWeek: [Number], // 0-6 (Sunday-Saturday)
  priceModifier: Number, // Percentage (20 = 20% increase, -10 = 10% decrease)
  minOccupancy: Number, // 0-100
  maxOccupancy: Number, // 0-100
  priority: Number, // Higher priority overrides lower
  isActive: Boolean
}
```

**Room Model** - New field:
- `basePrice`: Original price before modifiers

### Price Calculation Logic
1. Start with room's `basePrice`
2. Find all applicable pricing rules (by room type, date, occupancy)
3. Sort rules by priority (highest first)
4. Apply all matching rules' modifiers cumulatively
5. Return final calculated price

---

## 4. Housekeeping Management

### Overview
Complete housekeeping task management system for tracking room cleaning and maintenance.

### Features
- Task assignment to staff
- Priority levels
- Multiple task types
- Status tracking
- Issue reporting
- Supply tracking
- Automatic task creation on checkout

### Task Types
- `daily-cleaning`: Regular daily cleaning
- `checkout-cleaning`: Post-checkout deep clean
- `deep-cleaning`: Scheduled deep cleaning
- `maintenance`: Repair and maintenance tasks
- `inspection`: Quality inspection

### Priority Levels
- `low`: Can be done later
- `normal`: Standard priority
- `high`: Should be done soon
- `urgent`: Immediate attention required

### Status Flow
1. `pending`: Task created, not started
2. `in-progress`: Staff is working on it
3. `completed`: Task finished
4. `inspected`: Quality check completed

### API Endpoints

#### Get All Housekeeping Tasks (Admin)
```
GET /api/housekeeping
```
Query params: `status`, `priority`, `assignedTo`, `roomId`

#### Create Housekeeping Task (Admin)
```
POST /api/housekeeping
```
Body:
```json
{
  "roomId": "65f1234567890abcdef12345",
  "assignedTo": "65f9876543210fedcba98765",
  "taskType": "daily-cleaning",
  "priority": "normal",
  "notes": "Extra attention to bathroom"
}
```

#### Update Housekeeping Task (Admin)
```
PUT /api/housekeeping/:id
```
Body:
```json
{
  "status": "completed",
  "issues": ["Broken lamp", "Stained carpet"],
  "supplies": ["Cleaning solution", "Towels"]
}
```

#### Delete Housekeeping Task (Admin)
```
DELETE /api/housekeeping/:id
```

#### Get Housekeeping Statistics (Admin)
```
GET /api/housekeeping/stats
```
Returns:
```json
{
  "success": true,
  "data": {
    "tasksByStatus": [
      { "_id": "pending", "count": 5 },
      { "_id": "in-progress", "count": 3 },
      { "_id": "completed", "count": 12 }
    ],
    "tasksByPriority": [...],
    "roomsByStatus": [
      { "_id": "clean", "count": 45 },
      { "_id": "dirty", "count": 8 },
      { "_id": "in-progress", "count": 2 }
    ]
  }
}
```

### Database Schema

**Housekeeping Model:**
```javascript
{
  roomId: ObjectId (ref: Room),
  assignedTo: ObjectId (ref: User),
  status: "pending" | "in-progress" | "completed" | "inspected",
  priority: "low" | "normal" | "high" | "urgent",
  taskType: "daily-cleaning" | "checkout-cleaning" | "deep-cleaning" | "maintenance" | "inspection",
  startTime: Date,
  completedTime: Date,
  notes: String,
  issues: [String],
  supplies: [String]
}
```

**Room Model** - New fields:
- `status`: Added "maintenance" and "cleaning" to enum
- `housekeepingStatus`: "clean" | "dirty" | "in-progress" | "inspected"
- `lastCleaned`: Date of last cleaning
- `assignedHousekeeper`: ObjectId reference to User

### Automatic Workflows

1. **On Guest Checkout:**
   - Room status → "cleaning"
   - Housekeeping status → "dirty"
   - Auto-create "checkout-cleaning" task with "high" priority

2. **On Task Completion:**
   - Room housekeeping status → "clean"
   - Update `lastCleaned` timestamp

3. **On Task Start:**
   - Record `startTime`
   - Room housekeeping status → "in-progress"

---

## Integration Notes

### Frontend Integration

All features are backend-ready. To integrate in the frontend:

1. **Check-in/Check-out**: Add buttons in admin reservation management
2. **Advanced Search**: Create a search form with filters in the Rooms page
3. **Dynamic Pricing**: Display calculated prices, add pricing rules management in admin panel
4. **Housekeeping**: Create housekeeping dashboard in admin panel

### Migration Steps

If you have existing data:

1. **Rooms**: Run a script to set `basePrice = price` for all existing rooms
2. **Reservations**: Existing reservations will work with new status values
3. **Create default pricing rules** if needed
4. **No housekeeping tasks** will exist initially - they'll be created as needed

### Example Migration Script

```javascript
// Update existing rooms with basePrice
import Room from "./models/Room.js";

const rooms = await Room.find();
for (const room of rooms) {
  if (!room.basePrice) {
    room.basePrice = room.price;
    await room.save();
  }
}
```

---

## Testing the Features

### 1. Test Check-in/Check-out
```bash
# Get dashboard
curl http://localhost:5000/api/reservations/dashboard \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Check in a guest
curl -X PATCH http://localhost:5000/api/reservations/RESERVATION_ID/check-in \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Check out a guest
curl -X PATCH http://localhost:5000/api/reservations/RESERVATION_ID/check-out \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 2. Test Advanced Search
```bash
curl "http://localhost:5000/api/rooms/search?roomType=Deluxe&minPrice=100&maxPrice=300&sortBy=price"
```

### 3. Test Dynamic Pricing
```bash
# Create a pricing rule
curl -X POST http://localhost:5000/api/pricing \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "name": "Weekend Premium",
    "roomType": "all",
    "ruleType": "weekend",
    "priceModifier": 20,
    "priority": 5
  }'

# Get calculated price
curl "http://localhost:5000/api/pricing/room/ROOM_ID?checkInDate=2024-03-23&checkOutDate=2024-03-24"
```

### 4. Test Housekeeping
```bash
# Create task
curl -X POST http://localhost:5000/api/housekeeping \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "roomId": "ROOM_ID",
    "taskType": "daily-cleaning",
    "priority": "normal"
  }'

# Get stats
curl http://localhost:5000/api/housekeeping/stats \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## Security Considerations

- All admin endpoints require authentication + admin role
- Input validation on all endpoints
- MongoDB injection protection
- Rate limiting applied
- Query parameter sanitization

---

## Performance Tips

1. **Indexes**: All models have appropriate indexes for common queries
2. **Pagination**: Always use pagination for large datasets
3. **Caching**: Consider caching pricing calculations for frequently accessed rooms
4. **Batch Updates**: Use `updateAllRoomPrices` sparingly (runs async job)

---

## Future Enhancements

- Email notifications for check-in/check-out
- Mobile app for housekeeping staff
- AI-powered demand forecasting for dynamic pricing
- Automated housekeeping scheduling
- Integration with property management systems (PMS)
