import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { BedDouble, CalendarCheck, Clock, TrendingUp, ArrowRight, Shield } from "lucide-react";
import api from "../lib/api";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalRooms: 0, availableRooms: 0, myReservations: 0 });
  const [recentReservations, setRecentReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsRes, reservationsRes] = await Promise.all([
          api.get("/rooms?limit=100"),
          api.get("/reservations/my"),
        ]);
        const rooms = roomsRes.data.data;
        const reservations = reservationsRes.data.data;
        setStats({
          totalRooms: rooms.length,
          availableRooms: rooms.filter(r => r.status === "available").length,
          myReservations: reservations.length,
        });
        setRecentReservations(reservations.slice(0, 3));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: "Total Rooms", value: stats.totalRooms, icon: BedDouble, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Available Rooms", value: stats.availableRooms, icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
    { label: "My Reservations", value: stats.myReservations, icon: CalendarCheck, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  ];

  const getStatusColor = (status) => {
    const map = { confirmed: "text-green-400", cancelled: "text-red-400", pending: "text-yellow-400", completed: "text-blue-400" };
    return map[status] || "text-white/50";
  };

  return (
    <div className="relative min-h-screen">
      {/* Hotel Room Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1566665797739-1674de7a421a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80')`
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/95" />
      
      {/* Content */}
      <div className="relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Welcome header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Welcome back, <span className="gradient-text">{user?.name?.split(" ")[0]}</span> 👋
            </h1>
            <p className="text-white/70 mt-1">Here's your hotel reservation overview</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 glass px-4 py-2 rounded-lg border border-green-500/20 backdrop-blur-md">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm font-medium">Secure Session</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className={`border ${bg} hover:border-opacity-50 transition-all backdrop-blur-md bg-white/5`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm">{label}</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {loading ? "—" : value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center border backdrop-blur-sm`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-white/10 hover:border-white/20 transition-all group backdrop-blur-md bg-white/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 gradient-brand rounded-xl flex items-center justify-center shadow-lg">
                  <BedDouble className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold">Browse Rooms</h3>
                  <p className="text-white/60 text-sm">Find and book your perfect room</p>
                </div>
                <Link to="/rooms">
                  <Button size="sm" variant="gradient" className="gap-2">
                    Explore <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 hover:border-white/20 transition-all backdrop-blur-md bg-white/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <CalendarCheck className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold">My Reservations</h3>
                  <p className="text-white/60 text-sm">View and manage your bookings</p>
                </div>
                <Link to="/my-reservations">
                  <Button size="sm" variant="outline" className="gap-2">
                    View <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent reservations */}
        {recentReservations.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/60" />
                Recent Bookings
              </h2>
              <Link to="/my-reservations" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentReservations.map((r) => (
                <Card key={r._id} className="border-white/10 backdrop-blur-md bg-white/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                          <BedDouble className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">
                            Room {r.roomId?.roomNumber} – {r.roomId?.roomType}
                          </p>
                          <p className="text-white/60 text-xs">
                            {new Date(r.checkInDate).toLocaleDateString()} → {new Date(r.checkOutDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">${r.totalPrice?.toLocaleString()}</p>
                        <span className={`text-xs font-medium capitalize ${getStatusColor(r.status)}`}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
