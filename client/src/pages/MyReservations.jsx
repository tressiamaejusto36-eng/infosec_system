import { useState, useEffect } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import { CalendarCheck, BedDouble, XCircle, AlertCircle } from "lucide-react";
import api from "../lib/api";
import toast from "react-hot-toast";

const statusVariantMap = {
  confirmed: "success", cancelled: "destructive", pending: "warning", completed: "default"
};

export default function MyReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchReservations = async () => {
    try {
      const res = await api.get("/reservations/my");
      setReservations(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReservations(); }, []);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.patch(`/reservations/${cancelTarget._id}/cancel`);
      toast.success("Reservation cancelled.");
      setCancelTarget(null);
      fetchReservations();
    } catch (err) {
      toast.error(err.response?.data?.message || "Cancel failed.");
    } finally {
      setCancelling(false);
    }
  };

  const canCancel = (r) => r.status === "confirmed" && new Date() < new Date(r.checkInDate);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <CalendarCheck className="w-7 h-7 text-purple-400" />
          My Reservations
        </h1>
        <p className="text-white/50 mt-1 text-sm">{reservations.length} total bookings</p>
      </div>

      <Card className="border-white/10">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-white/30 animate-pulse">Loading...</div>
          ) : reservations.length === 0 ? (
            <div className="py-20 text-center text-white/30">
              <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-lg">No reservations yet</p>
              <p className="text-sm mt-1">Book a room to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Nights</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((r) => {
                  const nights = Math.ceil((new Date(r.checkOutDate) - new Date(r.checkInDate)) / 86400000);
                  return (
                    <TableRow key={r._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center justify-center">
                            <BedDouble className="w-4 h-4 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">#{r.roomId?.roomNumber}</p>
                            <p className="text-white/40 text-xs">{r.roomId?.roomType}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(r.checkInDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(r.checkOutDate).toLocaleDateString()}</TableCell>
                      <TableCell>{nights}</TableCell>
                      <TableCell className="font-medium text-white">${r.totalPrice?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariantMap[r.status] || "secondary"}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {canCancel(r) ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setCancelTarget(r)}
                            className="text-xs gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Cancel
                          </Button>
                        ) : (
                          <span className="text-white/20 text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cancel confirmation dialog */}
      <Dialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" /> Cancel Reservation
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your reservation for Room #{cancelTarget?.roomId?.roomNumber}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Keep Booking</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling} id="confirm-cancel-btn">
              {cancelling ? "Cancelling..." : "Yes, Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
