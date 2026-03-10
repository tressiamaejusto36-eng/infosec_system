import { useState, useEffect } from "react";
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
  ShieldCheck, BedDouble, CalendarCheck, Users,
  Plus, Pencil, Trash2, AlertCircle, X
} from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";

const ROOM_TYPES = ["Standard", "Deluxe", "Suite", "Presidential"];
const defaultForm = { roomNumber: "", roomType: "Standard", price: "", capacity: 1, description: "", status: "available" };

const statusVariantMap = {
  confirmed: "success", cancelled: "destructive", pending: "warning", completed: "default"
};

export default function AdminPanel() {
  const [tab, setTab] = useState("rooms");

  // Rooms state
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomForm, setRoomForm] = useState(defaultForm);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomDialog, setRoomDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);

  // Reservations state
  const [reservations, setReservations] = useState([]);
  const [resLoading, setResLoading] = useState(false);

  // Users state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

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
      const res = await api.get("/reservations");
      setReservations(res.data.data);
    } catch (e) { console.error(e); }
    finally { setResLoading(false); }
  };

  // Fetch users
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await api.get("/users");
      setUsers(res.data.data);
    } catch (e) { console.error(e); }
    finally { setUsersLoading(false); }
  };

  useEffect(() => { fetchRooms(); }, []);

  useEffect(() => {
    if (tab === "reservations" && reservations.length === 0) fetchReservations();
    if (tab === "users" && users.length === 0) fetchUsers();
  }, [tab]);

  const openCreate = () => {
    setEditingRoom(null);
    setRoomForm(defaultForm);
    setRoomDialog(true);
  };

  const openEdit = (room) => {
    setEditingRoom(room);
    setRoomForm({
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      price: room.price,
      capacity: room.capacity,
      description: room.description || "",
      status: room.status,
    });
    setRoomDialog(true);
  };

  const handleSaveRoom = async () => {
    if (!roomForm.roomNumber || !roomForm.price || !roomForm.capacity) {
      toast.error("Please fill all required fields.");
      return;
    }
    setSaving(true);
    try {
      if (editingRoom) {
        await api.put(`/rooms/${editingRoom._id}`, roomForm);
        toast.success("Room updated!");
      } else {
        await api.post("/rooms", roomForm);
        toast.success("Room created!");
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

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      toast.success("Role updated.");
      fetchUsers();
    } catch (err) {
      toast.error("Failed to update role.");
    }
  };

  const tabs = [
    { id: "rooms", label: "Rooms", icon: BedDouble },
    { id: "reservations", label: "Reservations", icon: CalendarCheck },
    { id: "users", label: "Users", icon: Users },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-yellow-400" />
            Admin Panel
          </h1>
          <p className="text-white/50 mt-1 text-sm">Manage rooms, reservations, and users</p>
        </div>
        <Badge variant="warning" className="px-3 py-1.5">
          <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />Administrator
        </Badge>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-white/10 gap-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px
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

      {/* ─── ROOMS TAB ──────────────────────────────────── */}
      {tab === "rooms" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-white/50 text-sm">{rooms.length} rooms total</p>
            <Button onClick={openCreate} variant="gradient" size="sm" className="gap-2" id="admin-add-room">
              <Plus className="w-4 h-4" /> Add Room
            </Button>
          </div>
          <Card className="border-white/10">
            <CardContent className="p-0">
              {roomsLoading ? (
                <div className="p-8 text-center text-white/30 animate-pulse">Loading rooms...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Price/Night</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room._id}>
                        <TableCell className="font-mono text-white font-medium">#{room.roomNumber}</TableCell>
                        <TableCell>{room.roomType}</TableCell>
                        <TableCell className="text-green-400 font-medium">${room.price}</TableCell>
                        <TableCell>{room.capacity} guests</TableCell>
                        <TableCell>
                          <Badge variant={room.status === "available" ? "success" : "destructive"}>
                            {room.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(room)} className="h-8 w-8 text-blue-400 hover:text-blue-300">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(room)} className="h-8 w-8 text-red-400 hover:text-red-300">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
            <DialogDescription>Fill in the room details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoomDialog(false)}>Cancel</Button>
            <Button id="room-save-btn" variant="gradient" onClick={handleSaveRoom} disabled={saving}>
              {saving ? "Saving..." : editingRoom ? "Save Changes" : "Create Room"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── DELETE CONFIRM DIALOG ───────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" /> Delete Room
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete Room #{deleteTarget?.roomNumber}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteRoom} id="confirm-delete-room">Delete Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
