// src/components/book/BookDetailsModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import SmartReader from './SmartReader';
import {
  XMarkIcon,
  BookOpenIcon,
  LockClosedIcon,
  LockOpenIcon,
  LanguageIcon,
  InformationCircleIcon,
  ArrowTopRightOnSquareIcon,
  DocumentTextIcon,
  ArrowLeftIcon
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

// ✅ Services
import authService from "../../api/authService";

// ✅ Components
import PolicyStatement from "../book/PolicyStatement";
import AccessForm from "../RestrictedAccess/AccessForm";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// ✅ Offline fallback cover
const FALLBACK_COVER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="360" height="520">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f1f5f9"/>
          <stop offset="100%" stop-color="#e2e8f0"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <text x="50%" y="50%" font-size="22" fill="#64748b"
        text-anchor="middle" dominant-baseline="middle"
        font-family="Arial, sans-serif">
        No Cover
      </text>
    </svg>
  `);

const getMediaUrl = (path) => {
  if (!path) return null;
  let clean = String(path).replace(/\\/g, "/");
  if (clean.startsWith("http")) return clean;
  if (!clean.startsWith("/")) clean = "/" + clean;
  return `${API_BASE_URL}${clean}`;
};

const getSafeName = (value, fallback = "N/A") => {
  if (!value) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value?.name) return value.name;
  return fallback;
};

// ✅ ADDED PROPS FOR DEEP SEARCH INTEGRATION
const BookDetailsModal = ({ 
  book, 
  onClose, 
  startView = "details",
  autoOpenReader = false,       // Deep search se aaya hai toh true hoga
  initialPage = 1,              // Deep search ka page number
  initialSearchQuery = ""       // Deep search ka keyword
}) => {
  const navigate = useNavigate();
  const [view, setView] = useState(startView);

  // ✅ Initialize SmartReader state based on Deep Search prop
  const [showSmartReader, setShowSmartReader] = useState(autoOpenReader);
  
  const [textContent, setTextContent] = useState("");
  const [isLoadingText, setIsLoadingText] = useState(false);

  // -----------------------------
  // UX: Body Scroll Lock + ESC Close
  // -----------------------------
  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKeyDown = (e) => {
      // Sirf tab close karein jab SmartReader open na ho
      if (e.key === "Escape" && !showSmartReader) handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showSmartReader]);

  // Handle prop changes (just in case book changes without unmounting)
  useEffect(() => {
    if (book) setView(startView);
    if (autoOpenReader) setShowSmartReader(true);
  }, [book, startView, autoOpenReader]);

  // -----------------------------
  // Derived Data
  // -----------------------------
  const title = book?.title || "Untitled";
  const author = getSafeName(book?.author, "Unknown");
  const category = getSafeName(book?.category, "General");
  const language = getSafeName(book?.language, "Urdu");
  const description = book?.description || "No description available.";
  
  const isRestricted = !!book?.is_restricted;
  const userHasAccess = !!book?.user_has_access;

  const coverUrl = useMemo(() => {
    const raw = book?.cover_image_url || book?.cover_image;
    return getMediaUrl(raw) || FALLBACK_COVER;
  }, [book]);

  const pdfUrl = useMemo(() => {
    return getMediaUrl(book?.pdf_url || book?.pdf_file);
  }, [book]);

  const txtUrl = useMemo(() => {
    return getMediaUrl(book?.txt_file_url || book?.txt_file);
  }, [book]);

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleClose = () => {
    setView("details");
    onClose?.();
  };

  const handleRequestClick = (e) => {
    e.preventDefault();
    if (book?.id) {
      localStorage.setItem("pendingRestrictedBookId", String(book.id));
    }
    if (!authService.isAuthenticated()) {
      toast.error("Please login to request access");
      handleClose();
      navigate("/login");
      return;
    }
    setView("policy");
  };

  const handleReadPdfClick = () => {
    if (!pdfUrl && !txtUrl) {
      toast.error("No digital format available to read.");
      return;
    }
    setShowSmartReader(true); 
  };

  const handleReadTextClick = async () => {
    if (!txtUrl && !pdfUrl) {
      toast.error("No digital format available to read.");
      return;
    }
    setShowSmartReader(true); 
  };

  if (!book) return null;

  // -----------------------------
  // UI
  // -----------------------------
  
  // ✅ SMART READER VIEW (Takes over the screen if true)
  if (showSmartReader) {
    return (
      <SmartReader 
        pdfUrl={pdfUrl} 
        txtUrl={txtUrl} 
        onClose={() => setShowSmartReader(false)} 
        initialPage={initialPage}                  // Pass page number
        initialSearchText={initialSearchQuery}     // Pass keyword for highlighting
      />
    );
  }

  // ✅ DEFAULT MODAL VIEW
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden relative max-h-[92vh] border border-white/30 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ✅ Sticky Header */}
        <div className="sticky top-0 z-[120] bg-white/95 backdrop-blur border-b border-slate-100 shrink-0">
          <div className="px-5 md:px-7 py-4 flex items-center justify-between gap-3">
            <div className="min-w-0 flex items-center gap-3">
              {/* Show Back Button if inside the Text Reader */}
              {view === "read_text" && (
                <button 
                  onClick={() => setView("details")}
                  className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  title="Back to Details"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                </button>
              )}
              <div>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                  {view === "read_text" ? "Reading Mode" : "Book Details"}
                </p>
                <h2 className="text-lg md:text-xl font-black text-slate-900 truncate">
                  {title}
                </h2>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition text-slate-700"
              title="Close (ESC)"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ===================== DETAILS VIEW ===================== */}
        {view === "details" && (
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 h-full">
              {/* LEFT COVER */}
              <div className="md:col-span-5 bg-gradient-to-b from-slate-50 to-white border-r border-slate-100 p-6 md:p-8 flex items-center justify-center">
                <div className="w-full flex justify-center">
                  <div className="w-[210px] sm:w-[240px] md:w-[260px] lg:w-[280px] aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl bg-white border border-slate-100">
                    <img
                      src={coverUrl}
                      alt={title}
                      className="w-full h-full object-contain bg-slate-100"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_COVER;
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT CONTENT */}
              <div className="md:col-span-7 flex flex-col relative h-full">
                {/* Scrollable content */}
                <div className="flex-1 px-6 md:px-8 py-6 pb-24">
                  {/* Badges */}
                  <div className="flex gap-2 flex-wrap mb-5">
                    <span className="bg-emerald-50 text-emerald-700 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase">
                      {category}
                    </span>
                    <span className="bg-slate-100 text-slate-700 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase flex items-center gap-1">
                      <LanguageIcon className="w-4 h-4" />
                      {language}
                    </span>
                    {isRestricted ? (
                      userHasAccess ? (
                        <span className="bg-indigo-50 text-indigo-700 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase flex items-center gap-1">
                          <LockOpenIcon className="w-4 h-4" /> Unlocked
                        </span>
                      ) : (
                        <span className="bg-red-50 text-red-700 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase flex items-center gap-1">
                          <LockClosedIcon className="w-4 h-4" /> Restricted
                        </span>
                      )
                    ) : null}
                  </div>

                  {/* Title + Author */}
                  <div className="mb-6">
                    <h3 className="text-2xl md:text-3xl font-black text-[#002147] leading-tight">
                      {title}
                    </h3>
                    <p className="text-blue-600 font-bold mt-2 text-sm md:text-base">
                      By {author}
                    </p>
                  </div>

                  {/* Description */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 md:p-5">
                    <div className="flex items-center gap-2 mb-2 text-slate-700 font-extrabold">
                      <InformationCircleIcon className="w-5 h-5 text-slate-500" />
                      About this book
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                      {description}
                    </p>
                  </div>
                </div>

                {/* ✅ Sticky Footer Actions */}
                <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-100 px-6 md:px-8 py-4">
                  {isRestricted && !userHasAccess ? (
                    <button
                      onClick={handleRequestClick}
                      className="w-full bg-[#002147] text-white py-3.5 px-6 rounded-2xl font-extrabold hover:bg-blue-900 transition-all flex items-center justify-center gap-3 shadow-md"
                    >
                      <LockClosedIcon className="w-5 h-5" />
                      Request Digital Access
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Read PDF Button */}
                      {pdfUrl && (
                        <button
                          onClick={handleReadPdfClick}
                          className="flex-1 py-3.5 px-6 rounded-2xl font-extrabold transition-all flex items-center justify-center gap-2 shadow-md bg-blue-600 text-white hover:bg-blue-700"
                        >
                          <BookOpenIcon className="w-5 h-5" />
                          Read PDF
                        </button>
                      )}

                      {/* Read Text Button */}
                      {txtUrl && (
                        <button
                          onClick={handleReadTextClick}
                          className="flex-1 py-3.5 px-6 rounded-2xl font-extrabold transition-all flex items-center justify-center gap-2 shadow-md bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          <DocumentTextIcon className="w-5 h-5" />
                          Read Text
                        </button>
                      )}

                      {/* Fallback if no files */}
                      {!pdfUrl && !txtUrl && (
                        <div className="w-full py-3.5 px-6 rounded-2xl font-extrabold bg-slate-100 text-slate-400 border border-slate-200 text-center cursor-not-allowed">
                          No Digital Formats Available
                        </div>
                      )}
                      
                      {/* Optional: Open PDF externally */}
                      {/* External 'Open' removed for consistent in-app reading experience */}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== IN-APP TEXT READER ===================== */}
        {view === "read_text" && (
          <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 md:p-8">
            <div className="max-w-4xl mx-auto bg-white p-6 md:p-12 rounded-2xl shadow-sm border border-slate-200 min-h-full">
              {isLoadingText ? (
                <div className="flex items-center justify-center h-64 text-slate-500 font-medium">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mr-3"></div>
                  Loading text...
                </div>
              ) : (
                <div 
                  className="prose max-w-none text-slate-800 text-base md:text-lg leading-loose font-serif whitespace-pre-wrap"
                  dir={language.toLowerCase() === 'urdu' || language.toLowerCase() === 'arabic' ? 'rtl' : 'ltr'}
                >
                  {textContent || "This document is empty."}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== POLICY VIEW ===================== */}
        {view === "policy" && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <PolicyStatement
              onAccept={() => setView("access_form")}
              onCancel={() => setView("details")}
            />
          </div>
        )}

        {/* ===================== ACCESS FORM VIEW ===================== */}
        {view === "access_form" && (
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <AccessForm
              book={book}
              onSuccess={() => {
                toast.success("Request Submitted!");
                localStorage.removeItem("pendingRestrictedBookId");
                handleClose();
              }}
              onCancel={() => setView("details")}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BookDetailsModal;