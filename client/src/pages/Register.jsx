import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ReCAPTCHA from "react-google-recaptcha";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Hotel, Eye, EyeOff, Lock, Mail, User, AlertCircle, CheckCircle } from "lucide-react";
import api from "../lib/api";
import toast from "react-hot-toast";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[a-z]/, "Must contain lowercase")
    .regex(/[0-9]/, "Must contain number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Must contain special character"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const passwordRules = [
  { label: "8+ characters", test: (v) => v?.length >= 8 },
  { label: "Uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "Lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "Number", test: (v) => /[0-9]/.test(v) },
  { label: "Special character", test: (v) => /[!@#$%^&*(),.?":{}|<>]/.test(v) },
];

export default function Register() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const passwordValue = watch("password", "");

  const onSubmit = async (data) => {
    setError("");
    
    // Get reCAPTCHA token
    const recaptchaToken = recaptchaRef.current?.getValue();
    if (!recaptchaToken) {
      setError("Please complete the reCAPTCHA verification.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
        recaptchaToken,
      });
      toast.success("Account created! Please log in.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
      recaptchaRef.current?.reset(); // Reset reCAPTCHA on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_hsl(161,94%,5%)_0%,_hsl(224,71%,4%)_60%)]" />
      <div className="absolute top-1/4 -right-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-float" style={{animationDelay: "2s"}} />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 gradient-brand rounded-2xl shadow-2xl mb-4">
            <Hotel className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">SecureStay</h1>
          <p className="text-white/50 mt-1 text-sm">Create your account</p>
        </div>

        <Card className="border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Create Account</CardTitle>
            <CardDescription>Join SecureStay to start booking rooms</CardDescription>
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
                <label className="text-sm text-white/70 font-medium">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input id="reg-name" placeholder="John Doe" className="pl-9" {...register("name")} />
                </div>
                {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-white/70 font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input id="reg-email" type="email" placeholder="you@example.com" className="pl-9" {...register("email")} />
                </div>
                {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-white/70 font-medium">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    id="reg-password"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-9"
                    {...register("password")}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                    onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password strength indicators */}
                {passwordValue && (
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {passwordRules.map(rule => (
                      <div key={rule.label} className={`flex items-center gap-1.5 text-xs ${rule.test(passwordValue) ? "text-green-400" : "text-white/30"}`}>
                        <CheckCircle className="w-3 h-3 flex-shrink-0" />
                        {rule.label}
                      </div>
                    ))}
                  </div>
                )}
                {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-white/70 font-medium">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input id="reg-confirm" type="password" placeholder="••••••••" className="pl-9" {...register("confirmPassword")} />
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs">{errors.confirmPassword.message}</p>}
              </div>

              {/* reCAPTCHA */}
              <div className="flex justify-center pt-2">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                  theme="dark"
                />
              </div>

              <Button id="reg-submit" type="submit" variant="gradient" className="w-full mt-2" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : "Create Account"}
              </Button>

              <div className="text-center pt-2">
                <span className="text-white/40 text-sm">Already have an account? </span>
                <Link to="/login" className="text-blue-400 hover:text-blue-300 text-sm font-medium">Sign in</Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
