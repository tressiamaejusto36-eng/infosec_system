# Quick Start Guide - New Features

## 🚀 Setup (One-time)

```bash
cd backend

# 1. Migrate existing rooms (adds basePrice field)
node migrateRoomPrices.js

# 2. (Optional) Seed sample pricing rules
node seedPricingRules.js

# 3. Restart server
npm start
```

---

## 📋 Quick API Reference

### Check-in/Check-out

```bash
# Dashboard
GET /api/reservations/dashboard

# Check in
PATCH /api/reservations/:id/check-in

# Check out
PATCH /api/reservations/:id/check-out
```

### Advanced Search

```bash
# Search rooms
GET /api/rooms/search?roomType=Deluxe,Suite&minPrice=100&maxPrice=300&minCapacity=2&amenities=WiFi,TV&checkInDate=2024-03-20&checkOutDate=2024-03-25&sortBy=price&sortOrder=asc
```

### Dynamic Pricing

```bash
# Get pricing rules
GET /api/pricing

# Create rule
POST /api/pricing
{
  "name": "Weekend Premium",
  "roomType": "all",
  "ruleType": "weekend",
  "priceModifier": 20,
  "priority": 5
}

# Get calculated price
GET /api/pricing/room/:roomId?checkInDate=2024-03-20&checkOutDate=2024-03-25

# Update all prices
POST /api/pricing/update-all
```

### Housekeeping

```bash
# Get tasks
GET /api/housekeeping?status=pending&priority=high

# Create task
POST /api/housekeeping
{
  "roomId": "...",
  "taskType": "daily-cleaning",
  "priority": "normal"
}

# Update task
PUT /api/housekeeping/:id
{
  "status": "completed"
}

# Get stats
GET /api/housekeeping/stats
```

---

## 🎨 Frontend Integration Examples

### 1. Check-in Button
```jsx
const handleCheckIn = async (reservationId) => {
  await api.patch(`/reservations/${reservationId}/check-in`);
  toast.success("Guest checked in!");
};
```

### 2. Advanced Search Form
```jsx
const searchRooms = async (filters) => {
  const params = new URLSearchParams(filters);
  const res = await api.get(`/rooms/search?${params}`);
  setRooms(res.data.data);
};
```

### 3. Display Dynamic Price
```jsx
const [price, setPrice] = useState(null);

useEffect(() => {
  const fetchPrice = async () => {
    const res = await api.get(
      `/pricing/room/${roomId}?checkInDate=${checkIn}&checkOutDate=${checkOut}`
    );
    setPrice(res.data.data);
  };
  fetchPrice();
}, [roomId, checkIn, checkOut]);

// Display: ${price.finalPrice} (was ${price.basePrice})
```

### 4. Housekeeping Task List
```jsx
const [tasks, setTasks] = useState([]);

useEffect(() => {
  const fetchTasks = async () => {
    const res = await api.get('/housekeeping?status=pending');
    setTasks(res.data.data);
  };
  fetchTasks();
}, []);
```

---

## 🔑 Key Concepts

### Dynamic Pricing
- **basePrice**: Original room price
- **price**: Current price (calculated from basePrice + rules)
- **priceModifier**: Percentage change (20 = +20%, -10 = -10%)
- **priority**: Higher priority rules override lower ones

### Housekeeping Status Flow
1. Guest checks out → Room status = "cleaning"
2. Task created → Status = "pending"
3. Staff starts → Status = "in-progress"
4. Staff completes → Status = "completed", Room = "clean"

### Reservation Status Flow
1. Created → "confirmed"
2. Guest arrives → "checked-in"
3. Guest leaves → "checked-out"
4. Can cancel → "cancelled"

---

## 💡 Pro Tips

1. **Pricing Rules**: Higher priority = applied last (overrides others)
2. **Search**: Combine multiple filters for precise results
3. **Housekeeping**: Auto-created on checkout with "high" priority
4. **Check-in**: Can only check in "confirmed" or "pending" reservations
5. **Dates**: Always use ISO 8601 format (YYYY-MM-DD)

---

## 🎯 Common Use Cases

### Weekend Pricing
```json
{
  "name": "Weekend Premium",
  "ruleType": "weekend",
  "priceModifier": 20,
  "roomType": "all"
}
```

### Summer Season
```json
{
  "name": "Summer Season",
  "ruleType": "seasonal",
  "startDate": "2024-06-01",
  "endDate": "2024-08-31",
  "priceModifier": 25,
  "roomType": "all"
}
```

### High Demand Surge
```json
{
  "name": "High Occupancy",
  "ruleType": "occupancy",
  "minOccupancy": 80,
  "maxOccupancy": 100,
  "priceModifier": 15,
  "roomType": "all"
}
```

---

## ✅ Testing Checklist

- [ ] Migrate room prices
- [ ] Create a pricing rule
- [ ] Search rooms with filters
- [ ] Check in a guest
- [ ] Check out a guest (verify housekeeping task created)
- [ ] Complete a housekeeping task
- [ ] View statistics

---

## 📚 Full Documentation

- **Complete Guide**: `NEW_FEATURES_GUIDE.md`
- **Implementation Details**: `FEATURES_IMPLEMENTATION_SUMMARY.md`
- **This Quick Start**: `QUICK_START_NEW_FEATURES.md`

---

**Ready to go! 🎉**
