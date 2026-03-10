import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Hotel, ShieldCheck, AlertCircle, Timer, RotateCcw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import toast from "react-hot-toast";

const OTP_EXPIRY = 300; // 5 minutes in seconds

export default function VerifyOTP() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const email = location.state?.email;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRY);
  const inputRefs = useRef([]);

  // Redirect if no email in state
  useEffect(() => {
    if (!email) navigate("/login", { replace: true });
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(timer); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const handleChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length < 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", { email, otp: otpValue });
      const { token, user } = res.data.data;
      login(token, user);
      toast.success(`Welcome back, ${user.name}!`);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid OTP. Please try again.";
      setError(msg);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(270,60%,5%)_0%,_hsl(224,71%,4%)_60%)]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600/20 border border-purple-500/30 rounded-2xl shadow-2xl mb-4">
            <ShieldCheck className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white">Verify OTP</h1>
          <p className="text-white/50 mt-1 text-sm">
            Enter the 6-digit code sent to <span className="text-white/80 font-medium">{email}</span>
          </p>
        </div>

        <Card className="border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl flex items-center gap-2">
              Two-Factor Authentication
              <span className={`flex items-center gap-1 text-sm font-normal ml-auto ${secondsLeft < 60 ? "text-red-400" : "text-white/50"}`}>
                <Timer className="w-4 h-4" />
                {formatTime(secondsLeft)}
              </span>
            </CardTitle>
            <CardDescription>OTP code is valid for 5 minutes and can only be used once</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {secondsLeft === 0 && (
                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm text-center">
                  OTP expired. Please <Link to="/login" className="underline font-medium">login again</Link>.
                </div>
              )}

              {/* OTP Input boxes */}
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    id={`otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e.target.value, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    disabled={secondsLeft === 0}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-lg border transition-all duration-200 bg-white/5 text-white outline-none
                      ${digit ? "border-blue-500 bg-blue-500/10" : "border-white/10"}
                      focus:border-blue-400 focus:bg-blue-500/10 focus:ring-2 focus:ring-blue-500/30
                      disabled:opacity-40 disabled:cursor-not-allowed`}
                  />
                ))}
              </div>

              <Button
                id="otp-submit"
                type="submit"
                variant="gradient"
                className="w-full"
                disabled={loading || secondsLeft === 0 || otp.join("").length < 6}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : "Verify & Sign In"}
              </Button>

              <div className="flex items-center justify-center gap-2 text-sm text-white/40">
                <RotateCcw className="w-3.5 h-3.5" />
                <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                  Request new OTP
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
