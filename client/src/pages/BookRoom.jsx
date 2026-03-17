import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "../components/ui/dialog";
import {
  BedDouble, Users, DollarSign, CalendarCheck,
  ArrowLeft, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Image
} from "lucide-react";
import api from "../lib/api";
import toast from "react-hot-toast";

export default function BookRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    api.get(`/rooms/${id}`)
      .then(res => setRoom(res.data.data))
      .catch(() => navigate("/rooms"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const today = new Date().toISOString().split("T")[0];

  const nights = (() => {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut) - new Date(checkIn);
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const totalPrice = nights * (room?.price || 0);

  const handleBook = async () => {
    setError("");
    setBooking(true);
    
    console.log('🎯 Starting booking process...');
    console.log('📅 Booking data:', {
      roomId: id,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      guestCount,
      specialRequests,
      nights,
      totalPrice
    });
    
    try {
      const response = await api.post("/reservations", {
        roomId: id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guestCount,
        specialRequests,
      });
      
      console.log('✅ Booking successful:', response.data);
      toast.success("Reservation confirmed!");
      navigate("/my-reservations");
    } catch (err) {
      console.error('❌ Booking error:', err);
      console.error('❌ Error response:', err.response?.data);
      
      let errorMessage = "Booking failed. Please try again.";
      
      if (err.response?.data) {
        if (err.response.data.errors && Array.isArray(err.response.data.errors)) {
          // Show specific validation errors
          errorMessage = err.response.data.errors.join(', ');
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setBooking(false);
      setShowConfirm(false);
    }
  };

  const nextImage = () => {
    if (room?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % room.images.length);
    }
  };

  const prevImage = () => {
    if (room?.images?.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + room.images.length) % room.images.length);
    }
  };

  if (loading) {
    return <div className="h-64 glass rounded-xl animate-pulse" />;
  }

  if (!room) return null;

  const canBook = room.status === "available" && checkIn && checkOut && nights > 0;
  const hasImages = room.images && room.images.length > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Rooms
      </button>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Room Info */}
        <Card className="md:col-span-3 border-white/10">
          {/* Room Image Gallery */}
          <div className="relative h-48 bg-gradient-to-br from-blue-900/50 to-indigo-900/50 rounded-t-xl overflow-hidden">
            {hasImages ? (
              <>
                <img 
                  src={`http://localhost:5000${room.images[currentImageIndex]}`} 
                  alt={`${room.roomType} Room ${room.roomNumber} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-blue-900/50 to-indigo-900/50">
                  <BedDouble className="w-20 h-20 text-white/10" />
                </div>
                
                {/* Navigation arrows */}
                {room.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
                
                {/* Image indicators */}
                {room.images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                    {room.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                )}
                
                {/* Image count */}
                <div className="absolute top-3 left-3">
                  <span className="flex items-center gap-1 text-white/80 text-xs font-medium bg-black/50 px-2 py-1 rounded-full">
                    <Image className="w-3 h-3" />
                    {currentImageIndex + 1} / {room.images.length}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <BedDouble className="w-20 h-20 text-white/10" />
              </div>
            )}
          </div>
          
          <CardContent className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">{room.roomType} Room</h1>
                <p className="text-white/40 text-sm">Room #{room.roomNumber}</p>
              </div>
              <Badge variant={room.status === "available" ? "success" : "destructive"}>
                {room.status}
              </Badge>
            </div>
            <p className="text-white/60 text-sm">{room.description || "A comfortable, well-appointed room with all modern amenities."}</p>
            <div className="flex gap-4 text-sm text-white/60">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />Up to {room.capacity} guests</span>
              <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-green-400" /><span className="text-white font-bold">${room.price}</span>/night</span>
            </div>
          </CardContent>
        </Card>

        {/* Booking Form */}
        <Card className="md:col-span-2 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-blue-400" />
              Book this Room
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5" />{error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-white/60 font-medium">Check-in Date</label>
              <Input type="date" value={checkIn} min={today} onChange={(e) => setCheckIn(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/60 font-medium">Check-out Date</label>
              <Input type="date" value={checkOut} min={checkIn || today} onChange={(e) => setCheckOut(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/60 font-medium">Guests</label>
              <Input type="number" value={guestCount} min={1} max={room.capacity} onChange={(e) => setGuestCount(Number(e.target.value))} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/60 font-medium">Special Requests</label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Any special requests..."
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              />
            </div>

            {nights > 0 && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">${room.price} × {nights} nights</span>
                  <span className="text-white font-bold">${totalPrice.toLocaleString()}</span>
                </div>
              </div>
            )}

            <Button
              onClick={() => setShowConfirm(true)}
              variant="gradient"
              className="w-full"
              disabled={!canBook}
              id="book-confirm-btn"
            >
              {room.status !== "available" ? "Not Available" : canBook ? "Reserve Now" : "Select Dates"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Reservation</DialogTitle>
            <DialogDescription>Please review your booking details before confirming.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {[
              ["Room", `#${room.roomNumber} – ${room.roomType}`],
              ["Check-in", new Date(checkIn).toLocaleDateString()],
              ["Check-out", new Date(checkOut).toLocaleDateString()],
              ["Nights", nights],
              ["Guests", guestCount],
              ["Total Price", `$${totalPrice.toLocaleString()}`],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm border-b border-white/5 pb-2">
                <span className="text-white/50">{label}</span>
                <span className="text-white font-medium">{value}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button variant="gradient" onClick={handleBook} disabled={booking} id="confirm-booking-btn">
              {booking ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Booking...
                </span>
              ) : (
                <span className="flex items-center gap-2"><CheckCircle className="w-4 h-4" />Confirm Booking</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}