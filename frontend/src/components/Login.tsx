import React, { useState } from "react";
import { Shield, Key, Eye, EyeOff, Sparkles, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleAuthProvider } from "../lib/firebase.ts";

interface LoginProps {
  onLogin: (role: "owner" | "manager", token?: string) => void;
  language: "en" | "mr";
  onLanguageChange: (lang: "en" | "mr") => void;
}

export default function LoginPortal({ onLogin, language, onLanguageChange }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googlePending, setGooglePending] = useState(false);

  const handleGoogleSignIn = async () => {
    setError("");
    setGooglePending(true);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const token = await result.user.getIdToken();
      onLogin("owner", token);
    } catch (err: any) {
      console.error("Google login failed:", err);
      setError(
        language === "mr"
          ? "गुगल लॉगिन अयशस्वी! कृपया पुन्हा प्रयत्न करा."
          : "Google login failed. Please ensure cookies are allowed."
      );
    } finally {
      setGooglePending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Simulate small latency for premium app feel
    setTimeout(() => {
      const u = username.trim().toLowerCase();
      const p = password;

      if (u === "owner" && p === "Admin@GBFC2025") {
        onLogin("owner");
      } else if (u === "manager" && p === "Admin@123") {
        onLogin("manager");
      } else {
        setError(
          language === "mr"
            ? "चुकीचे युझरनेम किंवा पासवर्ड! कृपया पुन्हा प्रयत्न करा."
            : "Invalid username or password credentials. Please try again!"
        );
        setIsSubmitting(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-orange-50 to-slate-100 p-4 font-sans select-none relative overflow-hidden">
      
      {/* Background Soft Glow circles */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-orange-300/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-amber-300/10 blur-[120px] pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-6 relative z-10"
      >
        {/* Top ribbon language toggler */}
        <div className="flex justify-between items-center">
          <span className="text-[10px] bg-amber-50 text-amber-800 font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider flex items-center space-x-1">
            <Shield className="w-3 h-3 text-amber-600" />
            <span>Secure Access Gateway</span>
          </span>
          <button
            onClick={() => onLanguageChange(language === "mr" ? "en" : "mr")}
            className="text-[10px] bg-slate-50 border border-slate-150 rounded-lg px-2.5 py-1 text-slate-700 font-bold hover:bg-slate-100 transition cursor-pointer"
          >
            {language === "mr" ? "English" : "मराठी"}
          </button>
        </div>

        {/* Branding header */}
        <div className="text-center space-y-1.5">
          <div className="mx-auto w-14 h-14 bg-gradient-to-tr from-orange-500 to-amber-550 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            {/* Embedded custom Flame SVG */}
            <svg
              xmlns="http://www.w3.org/2500/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
              GANESH BHEL
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">
              Business Suite Web Console
            </p>
          </div>
        </div>

        {/* Google Authentication Entry */}
        <div className="space-y-3">
          <button
            type="button"
            disabled={googlePending || isSubmitting}
            onClick={handleGoogleSignIn}
            className="w-full bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-bold p-3.5 rounded-xl text-xs cursor-pointer shadow-sm flex items-center justify-center space-x-2.5 transition select-none disabled:opacity-50"
          >
            {googlePending ? (
              <RefreshCw className="w-4 h-4 animate-spin text-orange-600" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            <span>
              {language === "mr" ? "गुगलद्वारे लॉग इन करा" : "Sign In with Google"}
            </span>
          </button>

          <div className="flex items-center justify-center space-x-2 my-4">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              {language === "mr" ? "किंवा भूमिका निवडा" : "Or use manual role"}
            </span>
            <div className="h-px bg-gray-200 flex-1"></div>
          </div>
        </div>

        {/* Form fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-gray-400 uppercase">
              {language === "mr" ? "युझरनेम" : "Username Role"}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder={language === "mr" ? "उदा. Owner किंवा Manager" : "e.g. Owner or Manager"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl p-3 pl-4 outline-none focus:border-orange-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <label className="block text-[10px] font-bold text-gray-400 uppercase">
                {language === "mr" ? "पासवर्ड" : "Password"}
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl p-3 pl-4 pr-10 outline-none focus:border-orange-500 focus:bg-white transition font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Validation Error banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[10px] text-rose-800 font-bold leading-normal uppercase flex items-start space-x-2"
            >
              <Shield className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-extrabold p-3.5 rounded-xl text-xs cursor-pointer shadow-lg shadow-orange-600/10 tracking-wide uppercase transition hover:-translate-y-0.5 flex items-center justify-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{language === "mr" ? "अथॉरिटी पडताळणी प्रलंबित..." : "Verifying Credentials..."}</span>
              </>
            ) : (
              <>
                <Key className="w-4 h-4" />
                <span>{language === "mr" ? "कन्सोल लॉग इन करा" : "Log In to Console"}</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info hints */}
        <div className="pt-4 border-t border-gray-50 text-center space-y-1">
          <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
            {language === "mr" ? "गोपनीयतेसाठी कृपया लॉग इन तपशील कोणाशीही शेअर करू नका." : "Authorized Personnel login only. Active sessions are audit logged."}
          </p>
          <p className="text-[8px] text-slate-300 font-extrabold uppercase tracking-widest">
            Ganesh Bhel Management Console v2.4
          </p>
        </div>
      </motion.div>
    </div>
  );
}
