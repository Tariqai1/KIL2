import React, { useMemo, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import useAuth from "../hooks/useAuth";
import { authService } from "../api/authService";
import apiClient from "../api/apiClient";

import {
  UserIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const Login = () => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const { login: setAuthData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isDisabled = useMemo(() => loading || googleLoading, [loading, googleLoading]);

  // --- Handlers ---
  const handleChange = (e) => {
    setCredentials((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  /**
   * ✅ FIXED SMART REDIRECT LOGIC
   * Debugging logs added to see why admin is going to home.
   */
  const redirectAfterLogin = (user) => {
    console.group("🔐 Login Redirect Logic Debug");
    console.log("User Data Received:", user);

    // 1. Role Extraction (Backend se role string bhi aa sakta hai ya object)
    let roleName = "";
    
    if (user?.role && typeof user.role === 'object') {
        roleName = user.role.name || ""; // e.g. { id: 1, name: "Admin" }
    } else if (typeof user?.role === 'string') {
        roleName = user.role; // e.g. "Admin"
    }

    roleName = roleName.toLowerCase().trim();
    console.log("Parsed Role Name:", roleName);

    // 2. Admin Check
    const adminRoles = ["admin", "superadmin", "manager", "editor", "librarian"];
    const isAdmin = adminRoles.includes(roleName);
    console.log("Is Admin?", isAdmin);

    // 3. Navigation
    if (isAdmin) {
      console.log("🚀 Redirecting to: /admin/dashboard");
      console.groupEnd();
      navigate("/admin/dashboard", { replace: true });
    } else {
      console.log("🏠 Redirecting to: / (Home)");
      console.groupEnd();
      
      const from = location.state?.from?.pathname;
      if (from && from !== "/login") {
        navigate(from, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  };

  // --- 1. Standard Login ---
  const handleLogin = async (e) => {
    e.preventDefault();

    const username = credentials.username?.trim();
    const password = credentials.password?.trim();

    if (!username || !password) {
      toast.error("Please enter both username and password.");
      triggerShake();
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Verifying credentials...");

    try {
      const result = await authService.login(username, password);
      
      if (result.success) {
        setAuthData(result); 
        toast.success(`Welcome back, ${result.user.full_name || result.user.username}!`, { id: toastId });
        
        // ✅ Pass user object to redirect logic
        redirectAfterLogin(result.user);
      }
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.detail || "Invalid credentials. Please try again.";
      toast.error(msg, { id: toastId });
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Google Login ---
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      const toastId = toast.loading("Authenticating with Google...");

      try {
        const res = await apiClient.post("/api/auth/google", {
          token: tokenResponse.access_token,
        });

        const { access_token, user } = res.data;

        setAuthData({ access_token, user });

        toast.success("Google Sign-In Successful!", { id: toastId });
        
        // ✅ Pass user object to redirect logic
        redirectAfterLogin(user);

      } catch (err) {
        console.error("Google Auth Error:", err);
        const msg = err?.response?.data?.detail || "Google login failed on server.";
        toast.error(msg, { id: toastId });
        triggerShake();
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      toast.error("Google Sign-In popup closed or failed.");
      triggerShake();
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#ECFEFF] relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm z-10"
      >
        <motion.div
          animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="p-8 bg-gradient-to-br from-[#002147] to-[#003366] text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheckIcon className="w-24 h-24 transform rotate-12" />
            </div>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4 border border-white/20 shadow-inner">
                <ArrowRightOnRectangleIcon className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Welcome Back</h2>
              <p className="text-blue-100 text-sm mt-1 font-medium">
                Library Management System
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-8">
            
            {/* Google Button */}
            <button
              onClick={() => googleLogin()}
              disabled={isDisabled}
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-50 active:scale-[0.98] transition-all shadow-sm group disabled:opacity-60 disabled:pointer-events-none"
            >
              {googleLoading ? (
                <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              ) : (
                <img 
                  src="https://www.svgrepo.com/show/475656/google-color.svg" 
                  alt="Google" 
                  className="w-5 h-5 group-hover:scale-110 transition-transform"
                />
              )}
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                Or login with email
              </span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              
              {/* Username */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">
                  Username
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-[#2D89C8] transition-colors">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={credentials.username}
                    onChange={handleChange}
                    disabled={isDisabled}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none
                    focus:ring-2 focus:ring-[#2D89C8]/20 focus:border-[#2D89C8] focus:bg-white transition-all text-sm font-medium text-slate-800"
                    placeholder="Enter your username"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] text-[#2D89C8] font-bold hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-[#2D89C8] transition-colors">
                    <LockClosedIcon className="w-5 h-5" />
                  </div>

                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    disabled={isDisabled}
                    className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none
                    focus:ring-2 focus:ring-[#2D89C8]/20 focus:border-[#2D89C8] focus:bg-white transition-all text-sm font-medium text-slate-800"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#2D89C8] transition-colors outline-none"
                    disabled={isDisabled}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: isDisabled ? 1 : 1.02 }}
                whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                type="submit"
                disabled={isDisabled}
                className="w-full py-3.5 rounded-xl bg-[#002147] text-white font-bold text-sm shadow-lg shadow-blue-900/20
                hover:bg-[#003366] hover:shadow-blue-900/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  "Sign In to Library"
                )}
              </motion.button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500 font-medium">
                Don't have an account?{" "}
                <Link to="/register" className="text-[#2D89C8] font-bold hover:text-[#1a5f8f] transition-colors ml-1">
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400 font-medium">
          &copy; {new Date().getFullYear()} Markaz Library System. Secure Access.
        </p>
      </motion.div>
    </div>
  );
};

export default Login;