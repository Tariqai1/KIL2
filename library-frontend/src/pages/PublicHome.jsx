import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthProvider';
import { Toaster, toast } from "react-hot-toast";
import {
  FaceFrownIcon,
  HeartIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";

// Components
import LibraryHero from "../components/public/LibraryHero";
import LibrarySearchStrip from "../components/public/LibrarySearchStrip";
import PublicBookCard from "../components/public/PublicBookCard";
import BookDetailsModal from "../components/book/BookDetailsModal";
import RestrictedAccessFlow from "../components/book/RestrictedAccessFlow";
import SuccessScreen from "../components/RestrictedAccess/SuccessScreen"; // ✅ Missing Import Fixed

// Services + Hooks
import { bookService } from "../api/bookService";
import { useBookSearch } from "../hooks/useBookSearch";
import LandingPostsPreview from "../components/public/LandingPostsPreview";
import DonationPanel from "../components/donation/DonationPanel";

// ✅ Skeleton Loader (Premium UI)
const BookCardSkeleton = () => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-pulse">
      <div className="h-40 bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );
};

const PublicHome = () => {
  const navigate = useNavigate();
  const { isAdmin, user, loading: authLoading } = useAuth(); // ✅ Auth Hook

  // --- 1) SMART REDIRECT (Admin Protection) ---
  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      console.log("👮‍♂️ Admin Detected on Public Home -> Redirecting to Dashboard");
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, isAdmin, authLoading, navigate]);

  // --- 2) DATA STATE ---
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  // Filters
  const [sortBy, setSortBy] = useState("newest");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const featuredBooks = useMemo(() => {
    if (!Array.isArray(books) || books.length === 0) return [];
    return books.slice(0, 6);
  }, [books]);

  // Router location state (preSearch)
  const location = useLocation();

  // --- 3) MODAL STATE ---
  const [selectedBook, setSelectedBook] = useState(null);
  const [restrictedBook, setRestrictedBook] = useState(null);
  const [isAccessFlowOpen, setIsAccessFlowOpen] = useState(false);

  // --- 4) FAVORITES ---
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("bookNest_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Categories list
  const categories = useMemo(
    () => [
      { value: "all", label: "All Categories" },
      { value: "aqeedah_fiqh", label: "Aqeedah & Fiqh" },
      { value: "quran_sciences", label: "Quran & Sciences" },
      { value: "ahkam_masail", label: "Ahkam & Masail" },
      { value: "history_seerah", label: "History & Seerah" },
      { value: "literature", label: "Literature" },
      { value: "science_tech", label: "Science & Tech" },
    ],
    []
  );

  // --- 5) SEARCH HOOK ---
  const {
    searchTerm,
    setSearchTerm,
    selectedLanguage,
    setSelectedLanguage,
    selectedCategory,
    setSelectedCategory,
    filteredBooks,
  } = useBookSearch(books);

  // --- 6) FETCH BOOKS ---
  const loadBooks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await bookService.getAllBooks(0, 200);
      const list = Array.isArray(data) ? data : data?.books || [];
      setBooks(list);
    } catch (error) {
      console.error("❌ PublicHome Load Error:", error);
      toast.error("Could not load library catalog.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // --- 7) AUTO-SEARCH EFFECT (from other pages) ---
  useEffect(() => {
    if (location.state?.preSearch) {
      setSearchTerm(location.state.preSearch);

      // Smooth scroll to grid
      setTimeout(() => {
        const el = document.getElementById("book-grid");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 200);
    }
  }, [location.state, setSearchTerm]);

  // --- 8) HANDLERS ---
  const toggleFavorite = (e, bookId) => {
    e.stopPropagation();

    setFavorites((prev) => {
      const exists = prev.includes(bookId);
      const newFavs = exists
        ? prev.filter((id) => id !== bookId)
        : [...prev, bookId];

      try {
        localStorage.setItem("bookNest_favorites", JSON.stringify(newFavs));
      } catch {
        // ignore storage errors
      }

      return newFavs;
    });
  };

  const handleRequestAccess = (book) => {
    setSelectedBook(null);
    setRestrictedBook(book);
    setIsAccessFlowOpen(true);
  };

  const handleClearAll = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedLanguage("all");
    setSortBy("newest");
    setShowFavoritesOnly(false);
  };

  // --- 9) SORTING (after filters) ---
  const sortedBooks = useMemo(() => {
    const list = Array.isArray(filteredBooks) ? [...filteredBooks] : [];

    const safeTitle = (b) => String(b?.title || b?.name || "").toLowerCase();

    if (sortBy === "az") {
      return list.sort((a, b) => safeTitle(a).localeCompare(safeTitle(b)));
    }

    if (sortBy === "oldest") {
      return list.sort((a, b) => {
        const da = new Date(a?.created_at || a?.upload_date || 0).getTime();
        const db = new Date(b?.created_at || b?.upload_date || 0).getTime();
        return da - db;
      });
    }

    // newest (default)
    return list.sort((a, b) => {
      const da = new Date(a?.created_at || a?.upload_date || 0).getTime();
      const db = new Date(b?.created_at || b?.upload_date || 0).getTime();
      return db - da;
    });
  }, [filteredBooks, sortBy]);

  // --- 10) FAVORITES FILTER (client side) ---
  const finalBooks = useMemo(() => {
    if (!showFavoritesOnly) return sortedBooks;
    return sortedBooks.filter((b) => favorites.includes(b.id));
  }, [sortedBooks, showFavoritesOnly, favorites]);

  // --- LOADING SCREEN FOR ADMIN REDIRECT ---
  if (authLoading) return null; // Or a spinner

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-gray-800 animate-in fade-in duration-500">
      <Toaster position="top-right" />

      {/* Hero */}
      <LibraryHero />

      {/* Library Overview */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 px-6 py-10 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.85)] sm:px-10 sm:py-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.16),_transparent_22%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.9fr] items-start">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs uppercase tracking-[0.35em] text-cyan-200 shadow-[0_0_0_1px_rgba(56,189,248,0.05)]">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse shadow-cyan-500/40" />
                Adaptive Knowledge Grid
              </span>

              <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                Welcome to the future of the library — intelligent, curated, and luminous.
              </h2>

              <p className="max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                Kokan Library now surfaces trusted Islamic resources with a digital-first, future-ready lens. Explore approved titles, discover featured collections, and access secure restricted books through a smart, polished reading experience.
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-cyan-500/15 bg-white/5 p-5 shadow-[0_30px_60px_-40px_rgba(96,165,250,0.35)] backdrop-blur-xl">
                  <p className="text-4xl font-bold text-white">{books.length}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.3em] text-cyan-200/80">Approved Titles</p>
                </div>
                <div className="rounded-3xl border border-violet-500/15 bg-white/5 p-5 shadow-[0_30px_60px_-40px_rgba(168,85,247,0.28)] backdrop-blur-xl">
                  <p className="text-4xl font-bold text-white">{featuredBooks.length}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.3em] text-violet-200/80">Featured Picks</p>
                </div>
                <div className="rounded-3xl border border-slate-400/10 bg-white/5 p-5 shadow-[0_30px_60px_-40px_rgba(148,163,184,0.25)] backdrop-blur-xl">
                  <p className="text-4xl font-bold text-white">Secure</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-300/80">Admin Approved</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 shadow-2xl">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 opacity-70" />
              <div className="space-y-5">
                <h3 className="text-2xl font-semibold tracking-tight text-white">Why this library feels futuristic</h3>
                <div className="space-y-4 text-sm text-slate-300">
                  <div className="rounded-3xl border border-slate-700/80 bg-slate-950/70 p-4 shadow-lg">
                    <p className="font-semibold text-white">AI-inspired curation</p>
                    <p className="mt-1 text-slate-400">Books are surfaced by relevance, trust, and community impact.</p>
                  </div>
                  <div className="rounded-3xl border border-slate-700/80 bg-slate-950/70 p-4 shadow-lg">
                    <p className="font-semibold text-white">Secure restricted access</p>
                    <p className="mt-1 text-slate-400">Admin-reviewed titles are held behind a trusted access flow.</p>
                  </div>
                  <div className="rounded-3xl border border-slate-700/80 bg-slate-950/70 p-4 shadow-lg">
                    <p className="font-semibold text-white">Instant discovery</p>
                    <p className="mt-1 text-slate-400">Search, filter, and browse without noise.</p>
                  </div>
                </div>
              </div>
              <div className="absolute -right-10 bottom-6 h-32 w-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/10 blur-3xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/85 p-6 shadow-2xl">
          <div className="mb-6 text-slate-200">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300 font-semibold">Library Search</p>
            <h3 className="text-2xl font-semibold text-white">Search the library collection</h3>
            <p className="mt-2 text-sm text-slate-400">Find books, authors, publishers and smart recommendations right from the library section.</p>
          </div>
          <LibrarySearchStrip
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
            categories={categories}
          />
        </div>
      </div>

      {/* Featured Section */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-indigo-600 font-bold">Library Highlights</p>
            <h2 className="text-3xl font-bold text-slate-900">Recommended by the library team</h2>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById("book-grid");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Browse full collection
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <BookCardSkeleton key={idx} />
            ))}
          </div>
        ) : featuredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredBooks.map((book) => (
              <PublicBookCard
                key={book.id}
                book={book}
                isFavorite={favorites.includes(book.id)}
                onToggleFavorite={(e) => toggleFavorite(e, book.id)}
                onClick={() => setSelectedBook(book)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            No featured titles are available yet. Please check back soon.
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8" id="book-grid">
        {/* Header + Stats */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-3xl font-serif font-bold text-[#002147]">
              {searchTerm ? `Results for "${searchTerm}"` : "Explore the Library"}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Browse our handpicked selection, curated recommendations, and full catalog from Kokan Islamic Library.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Favorites Toggle */}
            <button
              onClick={() => setShowFavoritesOnly((p) => !p)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold transition-all shadow-sm ${showFavoritesOnly
                ? "bg-pink-50 border-pink-200 text-pink-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              title="Show only favorite books"
            >
              <HeartIcon className="w-5 h-5" />
              Favorites
              {favorites.length > 0 && (
                <span className="ml-1 text-xs bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                  {favorites.length}
                </span>
              )}
            </button>

            {/* Refresh */}
            <button
              onClick={loadBooks}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-bold shadow-sm disabled:opacity-50"
              title="Refresh Books"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>

            {/* Count */}
            <div className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-bold text-gray-700">{finalBooks.length}</span>{" "}
              books
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : finalBooks.length > 0 ? (
          <div className="mb-10">
            {/* --- LATEST ARRIVALS SWIPER (Only on Default View) --- */}
            {!searchTerm && !showFavoritesOnly && sortedBooks.length > 0 && (
               <div className="mb-12">
                   <h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest mb-4">
                     Trending Now
                   </h3>
                   <Swiper
                     modules={[Autoplay, Navigation]}
                     spaceBetween={20}
                     loop={sortedBooks.length > 4}
                     autoplay={{
                       delay: 3000,
                       disableOnInteraction: false,
                     }}
                     breakpoints={{
                       320: { slidesPerView: 2 },
                       640: { slidesPerView: 3 },
                       768: { slidesPerView: 4 },
                       1024: { slidesPerView: 5 },
                     }}
                   >
                     {sortedBooks.slice(0, 8).map((book) => (
                       <SwiperSlide key={book.id}>
                         <PublicBookCard
                           book={book}
                           isFavorite={favorites.includes(book.id)}
                           onToggleFavorite={(e) => toggleFavorite(e, book.id)}
                           onClick={() => setSelectedBook(book)}
                         />
                       </SwiperSlide>
                     ))}
                   </Swiper>
               </div>
            )}

            {/* --- MAIN GRID --- */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {finalBooks.map((book) => (
                    <PublicBookCard
                      key={book.id}
                      book={book}
                      isFavorite={favorites.includes(book.id)}
                      onToggleFavorite={(e) => toggleFavorite(e, book.id)}
                      onClick={() => setSelectedBook(book)}
                    />
                ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
            <FaceFrownIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-700 font-bold text-lg">
              No books found matching your criteria.
            </p>
            <p className="text-gray-400 text-sm mt-1">
              Try different keywords or clear filters.
            </p>

            <button
              onClick={handleClearAll}
              className="mt-5 inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#2D89C8] text-white font-bold hover:bg-[#2374ac] transition-colors shadow-sm"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedBook && (
        <BookDetailsModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onRequestAccess={() => handleRequestAccess(selectedBook)}
        />
      )}

      {isAccessFlowOpen && (
        <RestrictedAccessFlow
          isOpen={isAccessFlowOpen}
          book={restrictedBook}
          onClose={() => setIsAccessFlowOpen(false)}
          onSuccess={() => setShowSuccess(true)}
        />
      )}

      {showSuccess && (
        <SuccessScreen
          onClose={() => setShowSuccess(false)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-16 border-t border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* LEFT: Posts */}
          <div className="lg:col-span-2">
            <LandingPostsPreview />
          </div>

          {/* RIGHT: Donation */}
          <div className="lg:col-span-1 lg:sticky lg:top-24 h-fit">
            <DonationPanel />
          </div>

        </div>
      </div>

    </div>
  );
};

export default PublicHome;