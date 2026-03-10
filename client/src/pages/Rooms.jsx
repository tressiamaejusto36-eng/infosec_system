import { useState, useEffect } from "react";
import RoomCard from "../components/RoomCard";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { BedDouble, Search, SlidersHorizontal, X } from "lucide-react";
import api from "../lib/api";

const ROOM_TYPES = ["All", "Standard", "Deluxe", "Suite", "Presidential"];

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [total, setTotal] = useState(0);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== "All") params.set("type", selectedType);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (maxPrice) params.set("maxPrice", maxPrice);
      params.set("limit", "50");
      const res = await api.get(`/rooms?${params.toString()}`);
      setRooms(res.data.data);
      setTotal(res.data.pagination?.total || res.data.data.length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, [selectedType, statusFilter, maxPrice]);

  const filtered = rooms.filter(r =>
    search === "" ||
    r.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
    r.roomType.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase())
  );

  const clearFilters = () => {
    setSelectedType("All");
    setStatusFilter("all");
    setMaxPrice("");
    setSearch("");
  };

  const hasFilters = selectedType !== "All" || statusFilter !== "all" || maxPrice !== "" || search !== "";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BedDouble className="w-7 h-7 text-blue-400" />
            Available Rooms
          </h1>
          <p className="text-white/50 mt-1 text-sm">{total} rooms in total</p>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-white/40 gap-2">
            <X className="w-3.5 h-3.5" /> Clear filters
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="w-4 h-4 text-white/40" />
          <span className="text-white/60 text-sm font-medium">Filters</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              placeholder="Search rooms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-lg border border-white/10 bg-white/5 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="all" className="bg-gray-900">All Status</option>
            <option value="available" className="bg-gray-900">Available</option>
            <option value="reserved" className="bg-gray-900">Reserved</option>
          </select>
          {/* Max price */}
          <Input
            type="number"
            placeholder="Max price/night"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-36"
          />
        </div>
        {/* Room type pills */}
        <div className="flex flex-wrap gap-2">
          {ROOM_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border
                ${selectedType === type
                  ? "bg-blue-600/30 text-blue-400 border-blue-600/50"
                  : "border-white/10 text-white/50 hover:text-white hover:border-white/20"
                }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Room Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-72 rounded-xl glass animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-lg">No rooms found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(room => <RoomCard key={room._id} room={room} />)}
        </div>
      )}
    </div>
  );
}
