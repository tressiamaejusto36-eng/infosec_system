# Analytics & Inventory Management API Documentation

## 📊 Analytics Endpoints (Admin Only)

All analytics endpoints require admin authentication:
```
Authorization: Bearer <admin_jwt_token>
```

### 1. Dashboard Analytics

**GET** `/api/analytics/dashboard`

Get comprehensive dashboard analytics including overview, revenue, and recent activity.

**Query Parameters:**
- `period` (optional) - Number of days to analyze (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 150,
      "totalRooms": 25,
      "availableRooms": 18,
      "totalReservations": 89,
      "occupancyRate": 28.0
    },
    "revenue": {
      "totalRevenue": 45600,
      "averageBookingValue": 512.36,
      "totalBookings": 89
    },
    "recentReservations": [...],
    "occupancyData": [...],
    "roomTypeStats": [...],
    "userGrowth": [...],
    "period": 30
  }
}
```

### 2. Revenue Analytics

**GET** `/api/analytics/revenue`

Detailed revenue analysis with time-based breakdowns.

**Query Parameters:**
- `period` (optional) - Number of days (default: 30)
- `groupBy` (optional) - Time grouping: 'hour', 'day', 'week', 'month' (default: 'day')

**Response:**
```json
{
  "success": true,
  "data": {
    "revenueByPeriod": [
      {
        "_id": "2024-03-01",
        "revenue": 1250,
        "bookings": 3,
        "averageValue": 416.67
      }
    ],
    "revenueByRoomType": [
      {
        "_id": "Suite",
        "revenue": 15600,
        "bookings": 12,
        "averagePrice": 280
      }
    ],
    "period": 30,
    "groupBy": "day"
  }
}
```

### 3. Occupancy Analytics

**GET** `/api/analytics/occupancy`

Room occupancy rates and utilization statistics.

**Query Parameters:**
- `period` (optional) - Number of days (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "occupancyByDay": [...],
    "roomStatusDistribution": [
      { "_id": "available", "count": 18 },
      { "_id": "reserved", "count": 7 }
    ],
    "averageStayDuration": {
      "averageDuration": 2.5,
      "minDuration": 1,
      "maxDuration": 7
    },
    "period": 30
  }
}
```

### 4. Customer Analytics

**GET** `/api/analytics/customers`

Customer segmentation and behavior analysis.

**Query Parameters:**
- `period` (optional) - Number of days (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "customerSegments": [
      {
        "_id": "VIP",
        "count": 12,
        "totalRevenue": 18500,
        "averageSpent": 1541.67
      }
    ],
    "topCustomers": [...],
    "customerRetention": [
      { "_id": true, "count": 45 },  // returning customers
      { "_id": false, "count": 23 }  // new customers
    ],
    "period": 30
  }
}
```

---

## 📦 Inventory Management Endpoints (Admin Only)

### 1. Get All Inventory Items

**GET** `/api/inventory`

Retrieve inventory items with filtering and pagination.

**Query Parameters:**
- `roomId` (optional) - Filter by room ID
- `category` (optional) - Filter by category
- `status` (optional) - Filter by status
- `condition` (optional) - Filter by condition
- `stockStatus` (optional) - Filter by stock level: 'critical', 'low', 'normal', 'overstocked'
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 20, max: 100)
- `sortBy` (optional) - Sort field (default: 'createdAt')
- `sortOrder` (optional) - Sort direction: 'asc' or 'desc' (default: 'desc')

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "roomId": {
        "_id": "...",
        "roomNumber": "101",
        "roomType": "Standard"
      },
      "itemName": "Queen Size Bed",
      "category": "Furniture",
      "quantity": 1,
      "minQuantity": 1,
      "maxQuantity": 1,
      "unitPrice": 800,
      "totalValue": 800,
      "status": "In Stock",
      "condition": "Good",
      "supplier": {...},
      "stockStatus": "normal",
      "daysSinceRestock": 45,
      "createdAt": "2024-03-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "pages": 3,
    "limit": 20
  }
}
```

### 2. Get Inventory Item by ID

**GET** `/api/inventory/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "itemName": "Smart TV 55\"",
    "category": "Electronics",
    "quantity": 1,
    "unitPrice": 650,
    "totalValue": 650,
    "status": "In Stock",
    "condition": "New",
    "warrantyExpiry": "2025-03-01T00:00:00.000Z",
    "nextMaintenanceDate": "2024-06-01T00:00:00.000Z",
    "barcode": "TV-101-001",
    "location": "Room 101",
    "notes": "55-inch smart TV with streaming capabilities"
  }
}
```

### 3. Create Inventory Item

**POST** `/api/inventory`

**Body:**
```json
{
  "roomId": "room_object_id",
  "itemName": "New Item",
  "category": "Electronics",
  "quantity": 5,
  "minQuantity": 2,
  "maxQuantity": 10,
  "unitPrice": 150.00,
  "supplier": {
    "name": "Supplier Name",
    "contact": "+1-555-0123",
    "email": "supplier@example.com"
  },
  "condition": "New",
  "barcode": "ITEM-001",
  "location": "Room 101",
  "notes": "Optional notes"
}
```

### 4. Update Inventory Item

**PUT** `/api/inventory/:id`

Same body structure as create endpoint.

### 5. Delete Inventory Item

**DELETE** `/api/inventory/:id`

Soft deletes the item (sets `isActive: false`).

### 6. Update Stock Quantity

**PATCH** `/api/inventory/:id/stock`

**Body:**
```json
{
  "quantity": 10,
  "operation": "set"  // 'set', 'add', or 'subtract'
}
```

**Operations:**
- `set` - Set exact quantity
- `add` - Add to current quantity (also updates `lastRestocked`)
- `subtract` - Subtract from current quantity (minimum 0)

### 7. Get Inventory Analytics

**GET** `/api/inventory/analytics`

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalItems": 156,
      "totalValue": 125600,
      "lowStockCount": 8,
      "maintenanceAlertsCount": 3
    },
    "categoryStats": [
      {
        "_id": "Electronics",
        "count": 25,
        "totalValue": 45600,
        "averageValue": 1824
      }
    ],
    "statusStats": [...],
    "conditionStats": [...],
    "lowStockItems": [...],
    "maintenanceAlerts": [...]
  }
}
```

---

## 📋 Data Models

### Inventory Item Schema

```javascript
{
  roomId: ObjectId,           // Reference to Room
  itemName: String,           // Item name (max 100 chars)
  category: String,           // Enum: Furniture, Electronics, Linens, etc.
  quantity: Number,           // Current stock quantity
  minQuantity: Number,        // Minimum stock level
  maxQuantity: Number,        // Maximum stock level
  unitPrice: Number,          // Price per unit
  totalValue: Number,         // Calculated: quantity * unitPrice
  supplier: {
    name: String,
    contact: String,
    email: String
  },
  status: String,             // Auto-calculated: In Stock, Low Stock, Out of Stock
  condition: String,          // New, Good, Fair, Poor, Damaged, Needs Replacement
  lastRestocked: Date,        // Last restock date
  nextMaintenanceDate: Date,  // Scheduled maintenance
  warrantyExpiry: Date,       // Warranty expiration
  notes: String,              // Additional notes
  barcode: String,            // Unique barcode
  location: String,           // Physical location
  isActive: Boolean,          // Soft delete flag
  createdAt: Date,
  updatedAt: Date
}
```

### Virtual Fields

- `stockStatus` - 'critical', 'low', 'normal', 'overstocked'
- `daysSinceRestock` - Days since last restock

---

## 🚀 Getting Started

### 1. Seed Sample Data

```bash
# First, seed rooms if not already done
cd backend
node seedRooms.js

# Then seed inventory
node seedInventory.js
```

### 2. Test Analytics Endpoints

```bash
# Get dashboard analytics
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:5000/api/analytics/dashboard

# Get revenue analytics for last 7 days
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:5000/api/analytics/revenue?period=7&groupBy=day"
```

### 3. Test Inventory Endpoints

```bash
# Get all inventory items
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:5000/api/inventory

# Get low stock items
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  "http://localhost:5000/api/inventory?stockStatus=low"

# Get inventory analytics
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:5000/api/inventory/analytics
```

---

## 📊 Frontend Integration Examples

### Analytics Dashboard Component

```javascript
const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get(`/analytics/dashboard?period=${period}`);
        setAnalytics(response.data.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
    };

    fetchAnalytics();
  }, [period]);

  if (!analytics) return <div>Loading...</div>;

  return (
    <div className="analytics-dashboard">
      <div className="overview-cards">
        <div className="card">
          <h3>Total Revenue</h3>
          <p>${analytics.revenue.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="card">
          <h3>Occupancy Rate</h3>
          <p>{analytics.overview.occupancyRate}%</p>
        </div>
        <div className="card">
          <h3>Total Bookings</h3>
          <p>{analytics.revenue.totalBookings}</p>
        </div>
      </div>
      
      {/* Charts and graphs */}
      <RevenueChart data={analytics.revenueByPeriod} />
      <OccupancyChart data={analytics.occupancyData} />
    </div>
  );
};
```

### Inventory Management Component

```javascript
const InventoryManager = () => {
  const [inventory, setInventory] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/inventory?${params}`);
      setInventory(response.data.data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (itemId, quantity, operation = 'set') => {
    try {
      await api.patch(`/inventory/${itemId}/stock`, { quantity, operation });
      fetchInventory(); // Refresh data
      toast.success('Stock updated successfully');
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  return (
    <div className="inventory-manager">
      <div className="filters">
        <select onChange={(e) => setFilters({...filters, category: e.target.value})}>
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Furniture">Furniture</option>
          {/* ... */}
        </select>
        
        <select onChange={(e) => setFilters({...filters, stockStatus: e.target.value})}>
          <option value="">All Stock Levels</option>
          <option value="critical">Critical</option>
          <option value="low">Low Stock</option>
          <option value="normal">Normal</option>
        </select>
      </div>

      <div className="inventory-table">
        {inventory.map(item => (
          <div key={item._id} className="inventory-item">
            <h4>{item.itemName}</h4>
            <p>Room: {item.roomId.roomNumber}</p>
            <p>Quantity: {item.quantity}</p>
            <p>Status: {item.status}</p>
            <button onClick={() => updateStock(item._id, 1, 'add')}>
              Add Stock
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 🔒 Security Features

- ✅ **Admin-only access** - All endpoints require admin JWT token
- ✅ **Input validation** - Comprehensive validation for all fields
- ✅ **Query parameter sanitization** - Prevents NoSQL injection
- ✅ **Pagination limits** - Maximum 100 items per request
- ✅ **Soft deletes** - Inventory items are deactivated, not deleted
- ✅ **Data aggregation** - Efficient MongoDB aggregation pipelines

---

## 📈 Key Features

### Analytics Features:
- **Real-time dashboard** with key metrics
- **Revenue tracking** with time-based analysis
- **Occupancy analytics** and utilization rates
- **Customer segmentation** and behavior analysis
- **Flexible time periods** and grouping options

### Inventory Features:
- **Complete CRUD operations** for inventory items
- **Stock level tracking** with automatic status updates
- **Maintenance scheduling** and warranty tracking
- **Supplier management** with contact information
- **Barcode support** for easy identification
- **Category-based organization** with 10 predefined categories
- **Advanced filtering** and search capabilities
- **Stock alerts** for low inventory and maintenance due dates

This comprehensive system provides hotel administrators with powerful tools to monitor business performance and manage physical assets effectively!