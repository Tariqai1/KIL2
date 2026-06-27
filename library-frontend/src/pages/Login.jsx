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
   * - Better role extraction
   * - Extended admin roles
   * - Proper async handling
   * - Debug logging
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

    // 2. ✅ EXTENDED Admin Roles List
    const adminRoles = [
      "admin",
      "superadmin", 
      "administrator",
      "manager",
      "editor",
      "librarian",
      "staff"
    ];
    
    const isAdmin = adminRoles.includes(roleName);
    console.log("Is Admin?", isAdmin, "Admin roles:", adminRoles);

    // 3. Navigation
    if (isAdmin) {
      console.log("🚀 Redirecting to: /admin/dashboard");
      console.groupEnd();
      // ✅ FIX: Use setTimeout to ensure proper execution order
      setTimeout(() => {
        navigate("/admin/dashboard", { replace: true });
      }, 100);
    } else {
      console.log("🏠 Redirecting to: / (Home)");
      console.groupEnd();
      
      const from = location.state?.from?.pathname;
      if (from && from !== "/login" && from !== "/register") {
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
    <div className="min-h-screen flex overflow-hidden bg-white">

      {/* ======================================================
          LEFT PANEL — Branding (desktop only)
         ====================================================== */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[48%] relative flex-col items-center justify-center p-14 overflow-hidden bg-gradient-to-br from-[#000C1D] via-[#001D3D] to-[#003566]">

        {/* Animated background mesh */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 -left-40 w-[520px] h-[520px] bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-40 w-[420px] h-[420px] bg-cyan-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)", backgroundSize: "56px 56px" }}
          />
          {/* Floating orbs */}
          <div className="absolute top-16 right-20 w-3 h-3 rounded-full bg-cyan-300/40 animate-ping" style={{ animationDuration: "3s" }} />
          <div className="absolute bottom-24 left-16 w-2 h-2 rounded-full bg-blue-300/50 animate-ping" style={{ animationDuration: "4s", animationDelay: "1s" }} />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-sm w-full text-center">

          {/* Logo icon */}
          <div className="flex justify-center mb-10">
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-cyan-400/20 blur-2xl scale-150" />
              <div className="relative w-20 h-20 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center shadow-2xl backdrop-blur-sm">
                <ShieldCheckIcon className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-black text-white leading-tight mb-1">Markaz Library</h1>
          <p className="text-cyan-300 font-bold text-xl mb-3">Management System</p>
          <p className="text-blue-200/55 text-sm mb-10 leading-relaxed">
            Your digital gateway to knowledge — manage collections, track borrowing history, and explore thousands of resources.
          </p>

          {/* Feature cards */}
          <div className="space-y-3 text-left">
            {[
              { emoji: "📚", title: "Books & Digital Resources", desc: "Full catalog with PDF viewer & tracking" },
              { emoji: "🔐", title: "Role-Based Access Control", desc: "Admin, Manager, Student & Member roles" },
              { emoji: "📊", title: "Real-Time Analytics", desc: "Borrowing trends & circulation reports" },
            ].map((f) => (
              <div
                key={f.title}
                className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 hover:bg-white/10 transition-all duration-300 cursor-default group"
              >
                <span className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">{f.emoji}</span>
                <div>
                  <div className="text-white font-bold text-sm">{f.title}</div>
                  <div className="text-blue-300/50 text-xs mt-0.5">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-10 text-blue-200/25 text-xs tracking-wide">
            &copy; {new Date().getFullYear()} Markaz Ahle Hadees Kokan
          </p>
        </div>
      </div>

      {/* ======================================================
          RIGHT PANEL — Form
         ====================================================== */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white p-6 sm:p-10 xl:p-16 overflow-y-auto relative">

        {/* Subtle bg decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none opacity-70" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-sky-50 to-cyan-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none opacity-70" />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative z-10 w-full max-w-[420px]"
        >
          {/* Mobile: mini logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-[#002147] flex items-center justify-center shadow-lg shadow-blue-900/25">
              <ShieldCheckIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">Markaz Library</p>
              <p className="text-[11px] text-slate-500 font-medium">Management System</p>
            </div>
          </div>

          {/* Page heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1.5 font-medium">Sign in to continue to your library account</p>
          </div>

          <motion.div
            animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : { x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Google Button */}
            <button
              onClick={() => googleLogin()}
              disabled={isDisabled}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 font-semibold py-3.5 rounded-2xl hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] transition-all duration-200 group disabled:opacity-50 disabled:pointer-events-none mb-5 shadow-sm"
            >
              {googleLoading ? (
                <span className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              ) : (
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
                />
              )}
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-5">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">or</span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-[#002147] transition-colors pointer-events-none">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={credentials.username}
                    onChange={handleChange}
                    disabled={isDisabled}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-[#002147] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,33,71,0.07)] transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Enter your username"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                  <Link to="/forgot-password" className="text-[11px] text-[#002147] font-bold hover:underline transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-[#002147] transition-colors pointer-events-none">
                    <LockClosedIcon className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    disabled={isDisabled}
                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl outline-none focus:border-[#002147] focus:bg-white focus:shadow-[0_0_0_4px_rgba(0,33,71,0.07)] transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#002147] transition-colors outline-none"
                    disabled={isDisabled}
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: isDisabled ? 1 : 1.01, y: isDisabled ? 0 : -1 }}
                whileTap={{ scale: isDisabled ? 1 : 0.98 }}
                type="submit"
                disabled={isDisabled}
                className="w-full py-4 rounded-2xl bg-[#002147] text-white font-bold text-sm shadow-lg shadow-[#002147]/20 hover:bg-[#003166] hover:shadow-[#002147]/35 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2.5 mt-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    <span>Sign In to Library</span>
                  </>
                )}
              </motion.button>
            </form>

            {/* Register Link */}
            <p className="mt-7 text-center text-sm text-slate-500 font-medium">
              Don't have an account?{" "}
              <Link to="/register" className="text-[#002147] font-bold hover:underline transition-colors">
                Create Account
              </Link>
            </p>
          </motion.div>

          {/* Footer */}
          <p className="mt-12 text-center text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Markaz Library System &bull; Secure Access
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;