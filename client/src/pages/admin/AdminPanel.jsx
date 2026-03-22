import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from "../../components/ui/dialog";
import {
  ShieldCheck, BedDouble, CalendarCheck, Users, Package, BarChart3,
  Plus, Pencil, Trash2, AlertCircle, TrendingUp, DollarSign,
  Upload, RefreshCw, Wrench, Image
} from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";

const ROOM_TYPES = ["Standard", "Deluxe", "Suite", "Presidential"];
const INVENTORY_CATEGORIES = ["Furniture", "Electronics", "Linens", "Bathroom", "Kitchen", "Cleaning", "Maintenance", "Amenities", "Safety", "Other"];
const defaultRoomForm = { roomNumber: "", roomType: "Standard", price: "", capacity: 1, description: "", status: "available" };
const defaultInventoryForm = { roomId: "", itemName: "", category: "Furniture", quantity: "", minQuantity: "", maxQuantity: "", unitPrice: "", condition: "Good", location: "", notes: "" };

const statusVariantMap = {
  confirmed: "success", cancelled: "destructive", pending: "warning", completed: "default"
};

export default function AdminPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || "analytics");

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState(30);

  // Rooms state
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomForm, setRoomForm] = useState(defaultRoomForm);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomDialog, setRoomDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Reservations state
  const [reservations, setReservations] = useState([]);
  const [resLoading, setResLoading] = useState(false);

  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Inventory state
  const [inventory, setInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryForm, setInventoryForm] = useState(defaultInventoryForm);
  const [editingInventory, setEditingInventory] = useState(null);
  const [inventoryDialog, setInventoryDialog] = useState(false);
  const [inventoryAnalytics, setInventoryAnalytics] = useState(null);

  // Fetch analytics
  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      console.log('Fetching analytics...');
      const res = await api.get(`/analytics/dashboard?period=${analyticsPeriod}`);
      console.log('Analytics response:', res.data);
      setAnalytics(res.data.data);
    } catch (e) { 
      console.error('Analytics error:', e);
      console.error('Error response:', e.response?.data);
      toast.error(`Failed to load analytics: ${e.response?.data?.message || e.message}`);
    }
    finally { setAnalyticsLoading(false); }
  };

  // Fetch rooms
  const fetchRooms = async () => {
    setRoomsLoading(true);
    try {
      const res = await api.get("/rooms?limit=100");
      setRooms(res.data.data);
    } catch (e) { console.error(e); }
    finally { setRoomsLoading(false); }
  };

  // Fetch reservations
  const fetchReservations = async () => {
    setResLoading(true);
    try {
      console.log('Fetching reservations...');
      const res = await api.get("/reservations");
      console.log('Reservations response:', res.data);
      setReservations(res.data.data);
    } catch (e) { 
      console.error('Reservations error:', e);
      console.error('Error response:', e.response?.data);
      toast.error(`Failed to load reservations: ${e.response?.data?.message || e.message}`);
    }
    finally { setResLoading(false); }
  };

  // Fetch users
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      console.log('Fetching users...');
      const res = await api.get("/users");
      console.log('Users response:', res.data);
      setUsers(res.data.data);
    } catch (e) { 
      console.error('Users error:', e);
      console.error('Error response:', e.response?.data);
      toast.error(`Failed to load users: ${e.response?.data?.message || e.message}`);
    }
    finally { setUsersLoading(false); }
  };

  // Fetch inventory
  const fetchInventory = async () => {
    setInventoryLoading(true);
    try {
      console.log('Fetching inventory...');
      const [itemsRes, analyticsRes] = await Promise.all([
        api.get("/inventory?limit=100"),
        api.get("/inventory/analytics")
      ]);
      console.log('Inventory items response:', itemsRes.data);
      console.log('Inventory analytics response:', analyticsRes.data);
      setInventory(itemsRes.data.data);
      setInventoryAnalytics(analyticsRes.data.data);
    } catch (e) { 
      console.error('Inventory error:', e);
      console.error('Error response:', e.response?.data);
      toast.error(`Failed to load inventory: ${e.response?.data?.message || e.message}`);
    }
    finally { setInventoryLoading(false); }
  };

  useEffect(() => {
    // Update tab from URL params
    const urlTab = searchParams.get('tab');
    if (urlTab && ['analytics', 'rooms', 'reservations', 'inventory', 'users'].includes(urlTab)) {
      setTab(urlTab);
    }
  }, [searchParams]);

  useEffect(() => {
    // Debug: Check current user and auth state
    const currentUser = JSON.parse(localStorage.getItem('ss_user') || 'null');
    const currentToken = localStorage.getItem('ss_token');
    
    console.log('Current user:', currentUser);
    console.log('Current token exists:', !!currentToken);
    console.log('Is admin:', currentUser?.role === 'admin');

    if (!currentUser || currentUser.role !== 'admin') {
      toast.error('Admin access required. Please login as admin.');
      return;
    }

    if (tab === "analytics") fetchAnalytics();
    if (tab === "rooms" && rooms.length === 0) fetchRooms();
    if (tab === "reservations" && reservations.length === 0) fetchReservations();
    if (tab === "users" && users.length === 0) fetchUsers();
    if (tab === "inventory" && inventory.length === 0) fetchInventory();
  }, [tab, analyticsPeriod]);

  const openCreateRoom = () => {
    setEditingRoom(null);
    setRoomForm(defaultRoomForm);
    setSelectedImages([]);
    setRoomDialog(true);
  };

  const openEditRoom = (room) => {
    setEditingRoom(room);
    setRoomForm({
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      price: room.price,
      capacity: room.capacity,
      description: room.description || "",
      status: room.status,
    });
    setSelectedImages([]);
    setRoomDialog(true);
  };

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });
    
    setSelectedImages(validFiles);
  };

  const uploadRoomImages = async (roomId) => {
    if (selectedImages.length === 0) return;
    
    console.log('🖼️ Starting image upload for room:', roomId);
    console.log('📁 Selected images:', selectedImages.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    setUploadingImages(true);
    try {
      const formData = new FormData();
      selectedImages.forEach(file => {
        formData.append('images', file);
      });

      console.log('📤 Sending upload request to:', `/rooms/${roomId}/images`);
      const response = await api.post(`/rooms/${roomId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Upload response:', response.data);
      toast.success(`${selectedImages.length} images uploaded successfully!`);
      setSelectedImages([]);
      
      // If editing, update the room data
      if (editingRoom && editingRoom._id === roomId) {
        setEditingRoom(prev => ({
          ...prev,
          images: response.data.data.images
        }));
      }
      
      // Refresh rooms list
      fetchRooms();
    } catch (err) {
      console.error('❌ Upload error:', err);
      console.error('❌ Error response:', err.response?.data);
      toast.error(err.response?.data?.message || "Image upload failed");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSaveRoom = async () => {
    if (!roomForm.roomNumber || !roomForm.price || !roomForm.capacity) {
      toast.error("Please fill all required fields.");
      return;
    }
    setSaving(true);
    try {
      let room;
      if (editingRoom) {
        const response = await api.put(`/rooms/${editingRoom._id}`, roomForm);
        room = response.data.data;
        toast.success("Room updated!");
      } else {
        const response = await api.post("/rooms", roomForm);
        room = response.data.data;
        toast.success("Room created!");
        
        // Upload images for new room
        if (selectedImages.length > 0) {
          await uploadRoomImages(room._id);
        }
      }
      
      setRoomDialog(false);
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRoom = async () => {
    try {
      await api.delete(`/rooms/${deleteTarget._id}`);
      toast.success("Room deleted.");
      setDeleteTarget(null);
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed.");
    }
  };

  const handleDeleteInventory = async (itemId) => {
    try {
      await api.delete(`/inventory/${itemId}`);
      toast.success("Inventory item deleted.");
      setDeleteTarget(null);
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed.");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      toast.success("Role updated.");
      fetchUsers();
    } catch (err) {
      toast.error("Failed to update role.");
    }
  };

  const openCreateInventory = async () => {
    setEditingInventory(null);
    // Fetch rooms if not already loaded
    if (rooms.length === 0) {
      try {
        const res = await api.get("/rooms?limit=100");
        setRooms(res.data.data);
        setInventoryForm({ ...defaultInventoryForm, roomId: res.data.data[0]?._id || "" });
      } catch (e) {
        console.error(e);
        setInventoryForm(defaultInventoryForm);
      }
    } else {
      setInventoryForm({ ...defaultInventoryForm, roomId: rooms[0]?._id || "" });
    }
    setInventoryDialog(true);
  };

  const openEditInventory = async (item) => {
    setEditingInventory(item);
    // Fetch rooms if not already loaded
    if (rooms.length === 0) {
      try {
        const res = await api.get("/rooms?limit=100");
        setRooms(res.data.data);
      } catch (e) {
        console.error(e);
      }
    }
    setInventoryForm({
      roomId: item.roomId._id,
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      maxQuantity: item.maxQuantity,
      unitPrice: item.unitPrice,
      condition: item.condition,
      location: item.location || "",
      notes: item.notes || ""
    });
    setInventoryDialog(true);
  };

  const handleSaveInventory = async () => {
    if (!inventoryForm.roomId || !inventoryForm.itemName || !inventoryForm.category) {
      toast.error("Please fill all required fields.");
      return;
    }
    setSaving(true);
    try {
      // Convert string values to numbers
      const payload = {
        ...inventoryForm,
        quantity: Number(inventoryForm.quantity) || 0,
        minQuantity: Number(inventoryForm.minQuantity) || 1,
        maxQuantity: Number(inventoryForm.maxQuantity) || 10,
        unitPrice: Number(inventoryForm.unitPrice) || 0
      };
      
      if (editingInventory) {
        await api.put(`/inventory/${editingInventory._id}`, payload);
        toast.success("Inventory item updated!");
      } else {
        await api.post("/inventory", payload);
        toast.success("Inventory item created!");
      }
      setInventoryDialog(false);
      fetchInventory();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const tabs = [
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "rooms", label: "Rooms", icon: BedDouble },
    { id: "reservations", label: "Reservations", icon: CalendarCheck },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "users", label: "Users", icon: Users },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-yellow-400" />
            Admin Dashboard
          </h1>
          <p className="text-white/50 mt-1 text-sm">Manage your hotel operations and analytics</p>
        </div>
        <Badge variant="warning" className="px-3 py-1.5">
          <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />Administrator
        </Badge>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-white/10 gap-1 overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap
              ${tab === id
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-white/40 hover:text-white/70"
              }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ─── ANALYTICS TAB ──────────────────────────────── */}
      {tab === "analytics" && (
        <div className="space-y-6">
          {/* Period selector */}
          <div className="flex items-center gap-4">
            <span className="text-white/70 text-sm">Period:</span>
            {[7, 30, 90].map(period => (
              <button
                key={period}
                onClick={() => setAnalyticsPeriod(period)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                  analyticsPeriod === period 
                    ? "bg-blue-600/20 text-blue-400 border border-blue-600/30" 
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {period} days
              </button>
            ))}
            <Button size="sm" variant="outline" onClick={fetchAnalytics} disabled={analyticsLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${analyticsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {analyticsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="border-white/10 animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-white/10 rounded mb-2"></div>
                    <div className="h-8 bg-white/10 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : analytics ? (
            <>
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-white/10 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-sm">Total Revenue</p>
                        <p className="text-2xl font-bold text-white">${analytics.revenue.totalRevenue.toLocaleString()}</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-gradient-to-br from-green-500/10 to-green-600/5">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-sm">Occupancy Rate</p>
                        <p className="text-2xl font-bold text-white">{analytics.overview.occupancyRate}%</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-gradient-to-br from-purple-500/10 to-purple-600/5">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-sm">Total Bookings</p>
                        <p className="text-2xl font-bold text-white">{analytics.revenue.totalBookings}</p>
                      </div>
                      <CalendarCheck className="w-8 h-8 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-white/10 bg-gradient-to-br from-orange-500/10 to-orange-600/5">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-sm">Avg Booking Value</p>
                        <p className="text-2xl font-bold text-white">${analytics.revenue.averageBookingValue.toFixed(0)}</p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-orange-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Room Type Performance */}
              <Card className="border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Room Type Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.roomTypeStats.map((stat) => (
                      <div key={stat._id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div>
                          <p className="text-white font-medium">{stat._id}</p>
                          <p className="text-white/60 text-sm">{stat.bookings} bookings</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">${stat.revenue.toLocaleString()}</p>
                          <p className="text-white/60 text-sm">revenue</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Recent Reservations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.recentReservations.slice(0, 5).map((reservation) => (
                      <div key={reservation._id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div>
                          <p className="text-white font-medium">{reservation.userId?.name}</p>
                          <p className="text-white/60 text-sm">Room {reservation.roomId?.roomNumber} - {reservation.roomId?.roomType}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">${reservation.totalPrice}</p>
                          <Badge variant={statusVariantMap[reservation.status]}>{reservation.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-white/10">
              <CardContent className="p-8 text-center">
                <p className="text-white/50">No analytics data available</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ─── ROOMS TAB ──────────────────────────────────── */}
      {tab === "rooms" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Room Management</h2>
            <Button onClick={openCreateRoom} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Room
            </Button>
          </div>

          <Card className="border-white/10">
            <CardContent className="p-0">
              {roomsLoading ? (
                <div className="p-8 text-center text-white/30 animate-pulse">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Images</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room._id}>
                        <TableCell className="font-medium text-white">#{room.roomNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{room.roomType}</Badge>
                        </TableCell>
                        <TableCell className="text-white">${room.price}/night</TableCell>
                        <TableCell className="text-white/60">{room.capacity} guests</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Image className="w-3 h-3 text-white/40" />
                            <span className="text-white/60 text-sm">{room.images?.length || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={room.status === 'available' ? 'success' : 'warning'}>
                            {room.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => openEditRoom(room)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setDeleteTarget(room)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {rooms.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-white/30 py-12">No rooms found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── RESERVATIONS TAB ───────────────────────────── */}
      {tab === "reservations" && (
        <Card className="border-white/10">
          <CardContent className="p-0">
            {resLoading ? (
              <div className="p-8 text-center text-white/30 animate-pulse">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guest</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reservations.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell>
                        <div>
                          <p className="text-white text-sm font-medium">{r.userId?.name}</p>
                          <p className="text-white/40 text-xs">{r.userId?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-white text-sm">#{r.roomId?.roomNumber}</p>
                        <p className="text-white/40 text-xs">{r.roomId?.roomType}</p>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(r.checkInDate).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm">{new Date(r.checkOutDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium text-white">${r.totalPrice?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariantMap[r.status] || "secondary"}>{r.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {reservations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-white/30 py-12">No reservations found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── INVENTORY TAB ──────────────────────────────── */}
      {tab === "inventory" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Inventory Management</h2>
            <Button onClick={openCreateInventory} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>

          {/* Inventory Analytics Cards */}
          {inventoryAnalytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-white/10 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">Total Items</p>
                      <p className="text-2xl font-bold text-white">{inventoryAnalytics.overview.totalItems}</p>
                    </div>
                    <Package className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-gradient-to-br from-green-500/10 to-green-600/5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">Total Value</p>
                      <p className="text-2xl font-bold text-white">${inventoryAnalytics.overview.totalValue.toLocaleString()}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-gradient-to-br from-orange-500/10 to-orange-600/5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">Low Stock</p>
                      <p className="text-2xl font-bold text-white">{inventoryAnalytics.overview.lowStockCount}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-orange-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-gradient-to-br from-red-500/10 to-red-600/5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">Maintenance</p>
                      <p className="text-2xl font-bold text-white">{inventoryAnalytics.overview.maintenanceAlertsCount}</p>
                    </div>
                    <Wrench className="w-8 h-8 text-red-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Inventory Items Table */}
          <Card className="border-white/10">
            <CardContent className="p-0">
              {inventoryLoading ? (
                <div className="p-8 text-center text-white/30 animate-pulse">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>
                          <div>
                            <p className="text-white text-sm font-medium">{item.itemName}</p>
                            {item.location && <p className="text-white/40 text-xs">{item.location}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-white text-sm">#{item.roomId?.roomNumber}</p>
                          <p className="text-white/40 text-xs">{item.roomId?.roomType}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              item.quantity <= item.minQuantity ? 'text-red-400' : 
                              item.quantity >= item.maxQuantity ? 'text-orange-400' : 'text-white'
                            }`}>
                              {item.quantity}
                            </span>
                            {item.quantity <= item.minQuantity && (
                              <AlertCircle className="w-3 h-3 text-red-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            item.condition === 'New' ? 'success' :
                            item.condition === 'Good' ? 'default' :
                            item.condition === 'Fair' ? 'warning' : 'destructive'
                          }>
                            {item.condition}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white">${item.totalValue?.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="ghost" onClick={() => openEditInventory(item)}>
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => setDeleteTarget(item)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {inventory.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-white/30 py-12">No inventory items found</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ─── USERS TAB ──────────────────────────────────── */}
      {tab === "users" && (
        <Card className="border-white/10">
          <CardContent className="p-0">
            {usersLoading ? (
              <div className="p-8 text-center text-white/30 animate-pulse">Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Failed Attempts</TableHead>
                    <TableHead className="text-right">Change Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 gradient-brand rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white font-medium text-sm">{u.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/60 text-sm">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === "admin" ? "warning" : "default"}>{u.role}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <span className={`text-sm font-mono ${u.failedLoginAttempts > 0 ? "text-red-400" : "text-white/30"}`}>
                          {u.failedLoginAttempts || 0}
                        </span>
                        {u.lockUntil && new Date(u.lockUntil) > new Date() && (
                          <span className="ml-2 text-xs text-orange-400">🔒 Locked</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={u.role === "admin" ? "outline" : "secondary"}
                          className="text-xs"
                          onClick={() => handleRoleChange(u._id, u.role === "admin" ? "user" : "admin")}
                        >
                          Make {u.role === "admin" ? "User" : "Admin"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── ADD/EDIT ROOM DIALOG ────────────────────────── */}
      <Dialog open={roomDialog} onOpenChange={setRoomDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
            <DialogDescription>Fill in the room details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-white/60">Room Number *</label>
                <Input id="room-number" value={roomForm.roomNumber} onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })} placeholder="101" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/60">Type *</label>
                <select
                  value={roomForm.roomType}
                  onChange={(e) => setRoomForm({ ...roomForm, roomType: e.target.value })}
                  className="w-full h-10 rounded-lg border border-white/10 bg-white/5 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  {ROOM_TYPES.map(t => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/60">Price/Night ($) *</label>
                <Input type="number" id="room-price" value={roomForm.price} onChange={(e) => setRoomForm({ ...roomForm, price: e.target.value })} placeholder="150" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/60">Capacity *</label>
                <Input type="number" id="room-capacity" min={1} value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/60">Status</label>
              <select
                value={roomForm.status}
                onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}
                className="w-full h-10 rounded-lg border border-white/10 bg-white/5 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                <option value="available" className="bg-gray-900">Available</option>
                <option value="reserved" className="bg-gray-900">Reserved</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/60">Description</label>
              <textarea
                value={roomForm.description}
                onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                rows={2}
                placeholder="Room description..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              />
            </div>
            
            {/* Image Upload Section */}
            {!editingRoom && (
              <div className="space-y-3">
                <label className="text-xs text-white/60">Room Images (Optional)</label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-4">
                  <div className="text-center">
                    <Image className="w-8 h-8 text-white/40 mx-auto mb-2" />
                    <p className="text-white/60 text-sm mb-2">Upload room images (max 5 files, 5MB each)</p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="room-images"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('room-images').click()}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Choose Images
                    </Button>
                  </div>
                  
                  {selectedImages.length > 0 && (
                    <div className="mt-3">
                      <p className="text-white/70 text-sm mb-2">{selectedImages.length} image(s) selected:</p>
                      <div className="space-y-1">
                        {selectedImages.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-white/5 rounded px-3 py-2">
                            <span className="text-white/80 text-sm truncate">{file.name}</span>
                            <span className="text-white/50 text-xs">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Show existing images for edit mode */}
            {editingRoom && editingRoom.images && editingRoom.images.length > 0 && (
              <div className="space-y-3">
                <label className="text-xs text-white/60">Current Images</label>
                <div className="grid grid-cols-3 gap-2">
                  {editingRoom.images.map((imageUrl, index) => {
                    // Handle both local uploads and external URLs
                    const getImageUrl = (url) => {
                      if (!url) return null;
                      if (url.startsWith('http://') || url.startsWith('https://')) {
                        return url;
                      }
                      const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;
                      return `${apiBase}${url}`;
                    };
                    
                    return (
                      <div key={index} className="relative group">
                        <img 
                          src={getImageUrl(imageUrl)} 
                          alt={`Room ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            try {
                              await api.delete(`/rooms/${editingRoom._id}/images`, {
                                data: { imageUrl }
                              });
                              toast.success("Image deleted");
                              fetchRooms();
                              // Update the editing room data
                              setEditingRoom(prev => ({
                                ...prev,
                                images: prev.images.filter(img => img !== imageUrl)
                              }));
                            } catch (err) {
                              toast.error("Failed to delete image");
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Add more images for existing room */}
            {editingRoom && (
              <div className="space-y-3">
                <label className="text-xs text-white/60">Add More Images</label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-4">
                  <div className="text-center">
                    <Image className="w-8 h-8 text-white/40 mx-auto mb-2" />
                    <p className="text-white/60 text-sm mb-2">Upload additional images (max 5 total)</p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      id="room-images-edit"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('room-images-edit').click()}
                      className="gap-2"
                      disabled={(editingRoom.images?.length || 0) >= 5}
                    >
                      <Upload className="w-4 h-4" />
                      {(editingRoom.images?.length || 0) >= 5 ? 'Max Images Reached' : 'Add Images'}
                    </Button>
                  </div>
                  
                  {selectedImages.length > 0 && (
                    <div className="mt-3">
                      <p className="text-white/70 text-sm mb-2">{selectedImages.length} image(s) selected:</p>
                      <div className="space-y-1">
                        {selectedImages.map((file, index) => (
                          <div key={index} className="flex items-center justify-between bg-white/5 rounded px-3 py-2">
                            <span className="text-white/80 text-sm truncate">{file.name}</span>
                            <span className="text-white/50 text-xs">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="gradient"
                        onClick={() => uploadRoomImages(editingRoom._id)}
                        disabled={uploadingImages}
                        className="mt-2 w-full"
                      >
                        {uploadingImages ? "Uploading..." : "Upload Selected Images"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoomDialog(false)}>Cancel</Button>
            <Button id="room-save-btn" variant="gradient" onClick={handleSaveRoom} disabled={saving || uploadingImages}>
              {saving ? "Saving..." : uploadingImages ? "Uploading..." : editingRoom ? "Save Changes" : "Create Room"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── ADD/EDIT INVENTORY DIALOG ───────────────────── */}
      <Dialog open={inventoryDialog} onOpenChange={setInventoryDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingInventory ? "Edit Inventory Item" : "Add New Inventory Item"}</DialogTitle>
            <DialogDescription>Fill in the inventory item details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-white/60">Room *</label>
                <select
                  value={inventoryForm.roomId}
                  onChange={(e) => setInventoryForm({ ...inventoryForm, roomId: e.target.value })}
                  className="w-full h-10 rounded-lg border border-white/10 bg-white/5 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="" className="bg-gray-900">Select Room</option>
                  {rooms.map(room => (
                    <option key={room._id} value={room._id} className="bg-gray-900">
                      #{room.roomNumber} - {room.roomType}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/60">Item Name *</label>
                <Input 
                  value={inventoryForm.itemName} 
                  onChange={(e) => setInventoryForm({ ...inventoryForm, itemName: e.target.value })} 
                  placeholder="Bed, TV, Towels..." 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/60">Category *</label>
                <select
                  value={inventoryForm.category}
                  onChange={(e) => setInventoryForm({ ...inventoryForm, category: e.target.value })}
                  className="w-full h-10 rounded-lg border border-white/10 bg-white/5 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  {INVENTORY_CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/60">Condition</label>
                <select
                  value={inventoryForm.condition}
                  onChange={(e) => setInventoryForm({ ...inventoryForm, condition: e.target.value })}
                  className="w-full h-10 rounded-lg border border-white/10 bg-white/5 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  {["New", "Good", "Fair", "Poor", "Damaged", "Needs Replacement"].map(cond => (
                    <option key={cond} value={cond} className="bg-gray-900">{cond}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/60">Quantity *</label>
                <Input 
                  type="number" 
                  min="0"
                  value={inventoryForm.quantity} 
                  onChange={(e) => setInventoryForm({ ...inventoryForm, quantity: e.target.value })} 
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/60">Min Quantity</label>
                <Input 
                  type="number" 
                  min="0"
                  value={inventoryForm.minQuantity} 
                  onChange={(e) => setInventoryForm({ ...inventoryForm, minQuantity: e.target.value })} 
                  placeholder="1"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/60">Max Quantity</label>
                <Input 
                  type="number" 
                  min="1"
                  value={inventoryForm.maxQuantity} 
                  onChange={(e) => setInventoryForm({ ...inventoryForm, maxQuantity: e.target.value })} 
                  placeholder="10"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-white/60">Unit Price ($)</label>
                <Input 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={inventoryForm.unitPrice} 
                  onChange={(e) => setInventoryForm({ ...inventoryForm, unitPrice: e.target.value })} 
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/60">Location</label>
              <Input 
                value={inventoryForm.location} 
                onChange={(e) => setInventoryForm({ ...inventoryForm, location: e.target.value })} 
                placeholder="Closet, Bathroom, Main area..." 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/60">Notes</label>
              <textarea
                value={inventoryForm.notes}
                onChange={(e) => setInventoryForm({ ...inventoryForm, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes about this item..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInventoryDialog(false)}>Cancel</Button>
            <Button variant="gradient" onClick={handleSaveInventory} disabled={saving}>
              {saving ? "Saving..." : editingInventory ? "Save Changes" : "Create Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DELETE CONFIRM DIALOG ───────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> 
              Delete {deleteTarget?.roomNumber ? 'Room' : 'Inventory Item'}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteTarget?.roomNumber ? `Room #${deleteTarget.roomNumber}` : deleteTarget?.itemName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={deleteTarget?.roomNumber ? handleDeleteRoom : () => handleDeleteInventory(deleteTarget._id)}
            >
              Delete {deleteTarget?.roomNumber ? 'Room' : 'Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
