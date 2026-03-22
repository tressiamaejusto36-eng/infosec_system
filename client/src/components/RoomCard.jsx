import { Link } from "react-router-dom";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { BedDouble, Users, DollarSign, Star, Image } from "lucide-react";

const roomTypeColors = {
  Standard: "secondary",
  Deluxe: "default",
  Suite: "warning",
  Presidential: "success",
};

export default function RoomCard({ room }) {
  const badgeVariant = roomTypeColors[room.roomType] || "default";
  const isAvailable = room.status === "available";
  const hasImages = room.images && room.images.length > 0;
  const primaryImage = hasImages ? room.images[0] : null;
  
  // Handle both local uploads and external URLs
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    // If it's already a full URL (starts with http:// or https://), use it as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    // Otherwise, it's a local path, prepend the API base URL
    const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;
    return `${apiBase}${imageUrl}`;
  };

  return (
    <Card className="group overflow-hidden hover:border-white/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      {/* Room image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-900/40 to-indigo-900/40 overflow-hidden">
        {hasImages ? (
          <>
            <img 
              src={getImageUrl(primaryImage)} 
              alt={`${room.roomType} Room ${room.roomNumber}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="absolute inset-0 hidden items-center justify-center bg-gradient-to-br from-blue-900/40 to-indigo-900/40">
              <BedDouble className="w-16 h-16 text-white/10 group-hover:scale-110 transition-transform duration-500" />
            </div>
            {/* Image count indicator */}
            {room.images.length > 1 && (
              <div className="absolute bottom-3 right-3">
                <span className="flex items-center gap-1 text-white/80 text-xs font-medium bg-black/50 px-2 py-1 rounded-full">
                  <Image className="w-3 h-3" />
                  {room.images.length}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BedDouble className="w-16 h-16 text-white/10 group-hover:scale-110 transition-transform duration-500" />
          </div>
        )}
        
        {/* Status badge overlay */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isAvailable
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : "bg-red-500/20 text-red-400 border-red-500/30"
            }`}
          >
            {isAvailable ? "Available" : "Reserved"}
          </span>
        </div>
        
        {/* Room number */}
        <div className="absolute bottom-3 left-3">
          <span className="text-white/60 text-xs font-mono bg-black/30 px-2 py-0.5 rounded">
            #{room.roomNumber}
          </span>
        </div>
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-white font-semibold text-base">{room.roomType} Room</h3>
            <p className="text-white/50 text-xs mt-0.5 line-clamp-2">
              {room.description || "Comfortable and stylish room with modern amenities."}
            </p>
          </div>
          <Badge variant={badgeVariant}>{room.roomType}</Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-white/60">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {room.capacity} guests
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-yellow-400" />
            4.8
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/8">
          <div className="flex items-baseline gap-1">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-white font-bold text-lg">{room.price.toLocaleString()}</span>
            <span className="text-white/40 text-xs">/night</span>
          </div>
          <Link to={`/rooms/${room._id}`}>
            <Button
              size="sm"
              variant={isAvailable ? "gradient" : "outline"}
              disabled={!isAvailable}
              className="text-xs"
            >
              {isAvailable ? "Book Now" : "Unavailable"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
