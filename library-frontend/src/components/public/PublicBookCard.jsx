// src/components/public/PublicBookCard.jsx
// 🚀 DRAMATICALLY IMPROVED: Premium Book Card with Animations & Engaging Design
import React, { useEffect, useMemo, useState } from "react";
import {
  LockClosedIcon,
  LockOpenIcon,
  EyeIcon,
  CalendarIcon,
  SparklesIcon,
  BookOpenIcon,
  StarIcon,
} from "@heroicons/react/24/solid";
import { motion } from "framer-motion";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://kil2-backend.onrender.com" : "http://127.0.0.1:8000")).replace(/\/$/, "");

const FALLBACK_NO_COVER = "https://via.placeholder.com/400x600?text=No+Cover";
const FALLBACK_BROKEN = "https://via.placeholder.com/400x600?text=Image+Not+Found";

const PublicBookCard = ({
  book,
  onClick,
  isFavorite = false,
  onToggleFavorite,
}) => {

  if (book?.is_restricted && !book?.user_has_access) {
    return null;
  }


  const [imgSrc, setImgSrc] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  // -----------------------------
  // Helpers
  // -----------------------------
  const safeText = (value, fallback = "Unknown") => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === "object") return value?.name || value?.title || fallback;
    const str = String(value).trim();
    return str.length ? str : fallback;
  };

  const safeNumber = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const d = new Date(dateString);
      if (Number.isNaN(d.getTime())) return "N/A";
      return d.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const title = useMemo(() => safeText(book?.title, "Untitled Book"), [book]);
  const author = useMemo(() => safeText(book?.author, "Unknown Author"), [book]);
  const bookId = useMemo(
    () => safeText(book?.id || book?.book_number, "000"),
    [book]
  );

  // ✅ ACCESS LOGIC (Updated)
  const isRestricted = !!book?.is_restricted;
  // Backend se jo naya flag aa raha hai usse use karein
  const userHasAccess = !!book?.user_has_access;

  // ✅ Views FIX
  const views = useMemo(() => {
    return safeNumber(
      book?.views ??
      book?.view_count ??
      book?.total_views ??
      book?.total_view ??
      book?.hits ??
      0,
      0
    );
  }, [book]);

  const metaDate = useMemo(
    () => formatDate(book?.created_at || book?.published_date),
    [book]
  );

  // -----------------------------
  // Image Resolver
  // -----------------------------
  useEffect(() => {
    setImgLoaded(false);

    if (!book) {
      setImgSrc(FALLBACK_NO_COVER);
      return;
    }

    const rawUrl = book.cover_image_url || book.cover_image;

    if (!rawUrl) {
      setImgSrc(FALLBACK_NO_COVER);
      return;
    }

    if (typeof rawUrl === "string" && rawUrl.startsWith("http")) {
      setImgSrc(rawUrl);
      return;
    }

    const path = String(rawUrl);
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    setImgSrc(`${API_BASE_URL}${cleanPath}`);
  }, [book]);

  const handleImageError = () => {
    setImgSrc(FALLBACK_BROKEN);
    setImgLoaded(true);
  };

  const handleCardClick = () => {
    if (typeof onClick === "function") onClick();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -8 }}
      onClick={handleCardClick}
      className="group relative bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer flex flex-col h-full overflow-hidden"
    >
      {/* ✨ PREMIUM BACKGROUND GRADIENT */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50" />
      </div>

      {/* 🎯 TOP-LEFT: SMART BADGES WITH ANIMATIONS */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        {isRestricted ? (
          userHasAccess ? (
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-lg border border-white/30 backdrop-blur-sm"
            >
              <LockOpenIcon className="w-3.5 h-3.5 animate-pulse" />
              <span>UNLOCKED</span>
            </motion.div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-pink-600 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-lg border border-white/30"
            >
              <LockClosedIcon className="w-3.5 h-3.5" />
              <span>RESTRICTED</span>
            </motion.div>
          )
        ) : (
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-lg border border-white/30"
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>PUBLIC</span>
          </motion.div>
        )}
      </div>

      {/* 🏷️ TOP-RIGHT: BOOK ID BADGE */}
      <motion.div
        whileHover={{ scale: 1.05, rotate: 3 }}
        className="absolute top-4 right-4 z-20"
      >
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-full shadow-lg border border-blue-400/30 backdrop-blur-sm">
          #{bookId}
        </div>
      </motion.div>

      {/* ❤️ FAVORITE BUTTON - BOTTOM RIGHT WITH ANIMATION */}
      {typeof onToggleFavorite === "function" && (
        <motion.button
          onClick={(e) => onToggleFavorite(e, book?.id)}
          whileHover={{ scale: 1.15, rotate: 15 }}
          whileTap={{ scale: 0.95 }}
          className="absolute bottom-4 right-4 z-20 px-3 py-2 rounded-full text-sm font-bold shadow-lg border border-gray-200 bg-white/95 backdrop-blur-md hover:bg-white transition-all duration-200"
          title={isFavorite ? "Remove Favorite" : "Add Favorite"}
        >
          {isFavorite ? (
            <span className="text-lg animate-bounce">❤️</span>
          ) : (
            <span className="text-lg hover:text-red-500 transition">🤍</span>
          )}
        </motion.button>
      )}

      {/* =============================== */}
      {/* 🖼️ PREMIUM COVER IMAGE AREA */}
      {/* =============================== */}
      <div className="relative px-4 pt-6 pb-4 flex justify-center bg-gradient-to-b from-slate-50 via-white to-blue-50/30 group-hover:from-blue-50 transition-all duration-300">
        
        {/* Book Cover Container with 3D Effect */}
        <motion.div
          whileHover={{ scale: 1.08, rotateY: 5 }}
          className="relative w-[150px] sm:w-[165px] md:w-[175px] lg:w-[185px] aspect-[2/3] rounded-2xl overflow-hidden shadow-xl group-hover:shadow-2xl transition-all duration-300"
        >
          {/* Decorative Border Glow */}
          <div className="absolute inset-0 rounded-2xl border-2 border-gradient-to-br from-blue-200/50 via-transparent to-purple-200/50 pointer-events-none z-10" />

          {/* Loading Skeleton */}
          {!imgLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 animate-pulse" />
          )}

          {/* Actual Image */}
          {imgSrc && (
            <img
              src={imgSrc}
              alt={title}
              onError={handleImageError}
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full transition-all duration-300 ${
                imgLoaded ? "opacity-100 group-hover:scale-105" : "opacity-0"
              }`}
              style={{ objectFit: "contain", background: "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)" }}
              loading="lazy"
            />
          )}

          {/* ✨ INTERACTIVE HOVER OVERLAY */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end justify-center pb-4"
          >
            <motion.span
              initial={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1, opacity: 1 }}
              className={`text-white text-xs font-bold px-4 py-2.5 rounded-full backdrop-blur-lg shadow-lg border border-white/30 flex items-center gap-1.5 ${
                isRestricted && !userHasAccess
                  ? "bg-red-600/90"
                  : "bg-gradient-to-r from-blue-600/90 to-purple-600/90"
              }`}
            >
              <BookOpenIcon className="w-4 h-4" />
              {isRestricted && !userHasAccess ? "Request Access" : "Preview"}
            </motion.span>
          </motion.div>
        </motion.div>
      </div>

      {/* =============================== */}
      {/* 📝 INFORMATION SECTION */}
      {/* =============================== */}
      <div className="px-4 pb-4 flex flex-col flex-grow text-center relative z-10">
        
        {/* Title with Enhanced Typography */}
        <motion.h3
          whileHover={{ color: "#2D89C8" }}
          className="text-sm md:text-base font-black text-[#002147] leading-tight mb-1.5 line-clamp-2 transition-colors duration-200"
          style={{ letterSpacing: "-0.5px" }}
        >
          {title}
        </motion.h3>

        {/* Author with Styling */}
        <p className="text-xs text-gray-600 mb-3 line-clamp-1 font-semibold">
          By <span className="text-blue-600 font-bold">{author}</span>
        </p>

        {/* Decorative Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          className="w-12 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent mx-auto mb-3"
        />

        {/* Meta Info: Views & Date */}
        <div className="flex justify-between items-center text-[10px] text-gray-600 font-semibold gap-2">
          
          {/* Views Counter with Icon */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex items-center gap-1 bg-gradient-to-r from-blue-50 to-indigo-50 px-2.5 py-1.5 rounded-lg border border-blue-100/50 group-hover:from-blue-100 group-hover:to-indigo-100 transition-all"
          >
            <EyeIcon className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-bold text-blue-700">{views}</span>
          </motion.div>

          {/* Date */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="flex items-center gap-1 bg-gradient-to-r from-amber-50 to-orange-50 px-2.5 py-1.5 rounded-lg border border-amber-100/50 group-hover:from-amber-100 group-hover:to-orange-100 transition-all"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-bold text-amber-700">{metaDate}</span>
          </motion.div>
        </div>

        {/* Rating Star (Optional - shows engagement) */}
        <div className="mt-3 flex justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: i < 4 ? 1 : 0.3, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <StarIcon className={`w-3 h-3 ${i < 4 ? "text-yellow-400" : "text-gray-300"}`} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* 🌟 FLOATING PARTICLES EFFECT (on hover) */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -20, 0],
              x: [0, Math.sin(i) * 10, 0],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-60"
            style={{
              left: `${20 + i * 30}%`,
              top: `${50 + i * 10}%`,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default PublicBookCard;