import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Hotel, Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import api from "../lib/api";
import toast from "react-hot-toast";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    setError("");
    setLoading(true);
    try {
      console.log('Attempting login with:', { email: data.email });
      const response = await api.post("/auth/login", data);
      console.log('Login response:', response.data);
      
      // Show alert with response for debugging
      alert('Response: ' + JSON.stringify(response.data, null, 2));
      
      if (response.data.success) {
        toast.success("OTP sent to your email!");
        navigate("/verify-otp", { state: { email: data.email } });
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error response:', err.response?.data);
      alert('Error: ' + JSON.stringify(err.response?.data || err.message, null, 2));
      const msg = err.response?.data?.message || "Login failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_hsl(210,100%,10%)_0%,_hsl(224,71%,4%)_60%)]" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-float" style={{animationDelay: "3s"}} />

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 gradient-brand rounded-2xl shadow-2xl mb-4 animate-pulse-glow">
            <Hotel className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">SecureStay</h1>
          <p className="text-white/50 mt-1 text-sm">Secure Hotel Reservation System</p>
        </div>

        <Card className="border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm text-white/70 font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-9"
                    {...register("email")}
                  />
                </div>
                {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-white/70 font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    id="login-password"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-9"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
              </div>

              <Button
                id="login-submit"
                type="submit"
                variant="gradient"
                className="w-full mt-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : "Sign In"}
              </Button>

              <div className="text-center pt-2">
                <span className="text-white/40 text-sm">Don't have an account? </span>
                <Link to="/register" className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                  Create one
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-white/20 text-xs mt-4">
          🔐 Protected with end-to-end encryption & 2FA
        </p>
      </div>
    </div>
  );
}
