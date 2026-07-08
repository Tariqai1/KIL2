import React, { useEffect, useRef, useState } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  MicrophoneIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

// ✅ GlobalSearchModal aur BookDetailsModal ko import karein
import GlobalSearchModal from "../book/GlobalSearchModal";
import BookDetailsModal from "../book/BookDetailsModal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

/* ---------------- Debounce Hook ---------------- */
const useDebounce = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
};

/* ---------------- Main Component ---------------- */
const LibrarySearchStrip = ({
  searchTerm = "",
  onSearchChange,
  suggestions = [],
  loading = false,
  onDeepSearchResultClick,
  title = "Library Search",
  subtitle = "Search the library collection",
  description = "Find books, authors, publishers and smart recommendations instantly.",
  showHint = true,
  placeholder = "Search books, authors, publishers...",
  enableVoice = true,
  enableDeepSearch = true,
  enableSuggestions = true,
}) => {
  const [localValue, setLocalValue] = useState(searchTerm);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [listening, setListening] = useState(false);
  
  // ✅ Deep Search Modal ka State
  const [isDeepSearchOpen, setIsDeepSearchOpen] = useState(false);

  // ✅ Auto-Opening the Book States
  const [deepSearchBook, setDeepSearchBook] = useState(null);
  const [deepSearchConfig, setDeepSearchConfig] = useState({ page: 1, query: "" });
  const [isFetchingBook, setIsFetchingBook] = useState(false);

  const inputRef = useRef(null);
  const debouncedValue = useDebounce(localValue, 300);

  /* -------- Apply debounced value -------- */
  useEffect(() => {
    onSearchChange?.(debouncedValue);
  }, [debouncedValue]);

  /* -------- Keyboard Shortcuts -------- */
  useEffect(() => {
    const handler = (e) => {
      // Normal Search: Ctrl + K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Deep Search: Ctrl + Shift + F
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setIsDeepSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* -------- Voice Search -------- */
  const startVoiceSearch = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Voice search not supported in this browser");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();
    setListening(true);

    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setLocalValue(text);
      setShowSuggestions(false);
      setListening(false);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
  };

  /* -------- Deep Search Result Click Handler -------- */
  const handleDeepResultClick = async (bookId, pageNumber, searchQuery) => {
    setIsDeepSearchOpen(false); // Modal band karo
    setIsFetchingBook(true);    // Loading spinner shuru karo
    
    try {
      // API se us book ka pura data fetch karo taaki reader me pass kar sakein
      const res = await fetch(`${API_BASE_URL}/api/books/${bookId}`);
      if (res.ok) {
        const bookData = await res.json();
        setDeepSearchConfig({ page: pageNumber, query: searchQuery });
        setDeepSearchBook(bookData); // Ye state set hote hi BookDetailsModal khul jayega
      } else {
        console.error("Failed to load book details");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsFetchingBook(false);
    }

    // Call optional parent prop if needed
    if(onDeepSearchResultClick) {
      onDeepSearchResultClick(bookId, pageNumber, searchQuery);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="mb-5 rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-[0_24px_80px_-45px_rgba(15,23,42,0.9)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">{title}</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{subtitle}</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">{description}</p>
              </div>
              <div className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm text-slate-200 backdrop-blur">
                Ctrl + K {enableVoice ? '• Voice Search' : ''} {enableDeepSearch ? '• Deep Search' : ''}
              </div>
            </div>
          </div>

          {/* ================= SEARCH BAR ================= */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative"
          >
            <motion.div
              whileFocusWithin={{
                scale: 1.02,
                boxShadow: "0 10px 35px rgba(45,137,200,0.18)",
              }}
              className="flex items-center bg-gray-50 border rounded-2xl"
            >
              <MagnifyingGlassIcon className="w-6 h-6 ml-4 text-gray-400" />

              <input
                ref={inputRef}
                value={localValue}
                onChange={(e) => {
                  setLocalValue(e.target.value);
                  setShowSuggestions(true);
                }}
                placeholder={placeholder}
                className="flex-1 px-4 py-4 bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
              />

              {/* Clear Button */}
              <AnimatePresence>
                {localValue && (
                  <motion.button
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    onClick={() => setLocalValue("")}
                    className="p-2 rounded-full hover:bg-gray-200 mr-1"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Voice Search Button */}
              {enableVoice ? (
                <button
                  onClick={startVoiceSearch}
                  title="Voice Search"
                  className={`p-2 rounded-full mr-1 transition-colors ${
                    listening ? "bg-red-100 animate-pulse text-red-600" : "hover:bg-gray-200 text-gray-600"
                  }`}
                >
                  <MicrophoneIcon className="w-5 h-5" />
                </button>
              ) : null}

              {/* ✅ NAYA: Deep Search Button with Loading State */}
              {enableDeepSearch ? (
                <button
                  onClick={() => setIsDeepSearchOpen(true)}
                  title="Deep Search inside Books (Ctrl+Shift+F)"
                  className="p-2 rounded-full hover:bg-indigo-100 hover:text-indigo-600 text-gray-600 mr-2 transition-colors border border-transparent hover:border-indigo-200"
                >
                  {isFetchingBook ? (
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <DocumentTextIcon className="w-5 h-5" />
                  )}
                </button>
              ) : null}

            </motion.div>

            {/* ================= SUGGESTIONS ================= */}
            <AnimatePresence>
              {enableSuggestions && showSuggestions && localValue && suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute w-full mt-2 bg-white rounded-xl shadow-xl border overflow-hidden"
                >
                  {suggestions.slice(0, 5).map((item, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setLocalValue(item);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm"
                    >
                      {item}
                    </button>
                  ))}
                  
                  {/* ✅ NAYA: Deep Search Suggestion Link */}
                  <div className="border-t border-gray-100 bg-gray-50 p-2">
                     <button 
                       onClick={() => setIsDeepSearchOpen(true)}
                       className="w-full flex items-center justify-center gap-2 text-sm text-indigo-600 font-medium p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                     >
                       <DocumentTextIcon className="w-4 h-4" />
                       Search "{localValue}" inside book texts...
                     </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ================= SKELETON ================= */}
            {loading && (
              <div className="absolute w-full mt-2 bg-white rounded-xl shadow border p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-4 bg-gray-200 rounded animate-pulse"
                  />
                ))}
              </div>
            )}
          </motion.div>

          {/* ================= HINT ================= */}
          {showHint ? (
            <div className="flex items-center justify-between text-xs text-gray-500 mt-2 px-2">
              <p>⌘/Ctrl + K (Catalog) • Voice Search • Live Results</p>
              <p className="text-indigo-500 font-medium bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                New: Deep Search (Ctrl+Shift+F)
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* ✅ DEEP SEARCH MODAL RENDER */}
      <GlobalSearchModal 
        isOpen={isDeepSearchOpen}
        onClose={() => setIsDeepSearchOpen(false)}
        onResultClick={handleDeepResultClick}
      />

      {/* ✅ HIDDEN BOOK MODAL (Auto-opens SmartReader when deepSearchBook is set) */}
      {deepSearchBook && (
        <BookDetailsModal
          book={deepSearchBook}
          onClose={() => setDeepSearchBook(null)}
          startView="details"
          autoOpenReader={true} // Seedha reader me khulega
          initialPage={deepSearchConfig.page}
          initialSearchQuery={deepSearchConfig.query}
        />
      )}
    </>
  );
};

export default LibrarySearchStrip;