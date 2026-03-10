import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { User, Mail, Shield, Save, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import toast from "react-hot-toast";

const schema = z.object({
  name: z.string().min(2, "At least 2 characters").max(100),
  email: z.string().email("Invalid email"),
});

export default function Profile() {
  const { user, login } = useAuth();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name || "", email: user?.email || "" },
  });

  const onSubmit = async (data) => {
    setError("");
    setSuccess(false);
    setSaving(true);
    try {
      const res = await api.put("/users/profile", data);
      // Update local auth context with new user data  
      const token = localStorage.getItem("ss_token");
      login(token, res.data.data);
      setSuccess(true);
      toast.success("Profile updated!");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <User className="w-7 h-7 text-blue-400" />
          My Profile
        </h1>
        <p className="text-white/50 mt-1 text-sm">Manage your account settings</p>
      </div>

      {/* Avatar card */}
      <Card className="border-white/10">
        <CardContent className="p-6 flex items-center gap-5">
          <div className="w-20 h-20 gradient-brand rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-xl">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{user?.name}</h2>
            <p className="text-white/50 text-sm">{user?.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={user?.role === "admin" ? "warning" : "default"}>
                <Shield className="w-3 h-3 mr-1" />
                {user?.role === "admin" ? "Administrator" : "Guest"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card className="border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Edit Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4" />{error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                <CheckCircle className="w-4 h-4" />Profile updated successfully!
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm text-white/70 font-medium">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input className="pl-9" id="profile-name" {...register("name")} />
              </div>
              {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-white/70 font-medium">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input type="email" className="pl-9" id="profile-email" {...register("email")} />
              </div>
              {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
            </div>

            <Button
              id="profile-save"
              type="submit"
              variant="gradient"
              className="gap-2"
              disabled={!isDirty || saving}
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security info */}
      <Card className="border-white/10">
        <CardContent className="p-5">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-white font-medium text-sm">Security</p>
              <p className="text-white/40 text-xs">
                Your account is protected with bcrypt password hashing and OTP two-factor authentication.
                Change your password by logging out and registering a new account with a new password.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
