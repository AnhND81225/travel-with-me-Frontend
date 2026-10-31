import React, { useEffect, useState } from "react";
import { OrderCheckout } from "../orders/OrderCheckout";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  Mountain,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building,
  MapPin,
  Sparkles,
  Clock,
  ArrowRight,
  ChevronRight,
  Search,
  ShoppingBag,
  Package,
  RefreshCw,
  AlertCircle,
  Check,
  Truck,
  Compass,
  SlidersHorizontal,
  X,
  ArrowLeft,
  Filter,
  Tag,
  Layers,
  ChevronLeft,
} from "lucide-react";
import { Card, Button, Badge } from "../../components/ui";
import { storefrontAssets as images } from "../../data/storefront";
import {
  Account,
  ApiError,
  Branch,
  Page,
  Product,
  Stock,
  allProducts,
  catalogApi,
  saveToken,
  vnd,
} from "./catalogApi";
import "./equipment.css";

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to complete the request";
function useAccount() {
  const [state, setState] = useState<{
    loading: boolean;
    account: Account | null;
    error: string;
  }>({ loading: true, account: null, error: "" });

  useEffect(() => {
    let alive = true;
    catalogApi<Account>("/users/me")
      .then((account) => {
        if (alive)
          setState({
            loading: false,
            account: account.status === "ACTIVE" ? account : null,
            error: "",
          });
      })
      .catch((error) => {
        if (alive)
          setState({
            loading: false,
            account: null,
            error:
              error instanceof ApiError && [401, 403].includes(error.status)
                ? ""
                : errorText(error),
          });
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

function SessionLinks({ account }: { account: Account | null }) {
  const location = useLocation();
  return (
    <nav className="eq-nav" aria-label="Equipment and inventory">
      <Link to="/shop">Equipment</Link>
      <Link to="/cart">Cart</Link>
      <Link to="/orders">My orders</Link>
      {account?.role === "ADMIN" && <Link to="/admin/orders">Manage orders</Link>}
      {account?.role === "ADMIN" && (
        <Link to="/admin/catalog">Equipment management</Link>
      )}
      {account && ["ADMIN", "STAFF"].includes(account.role) && (
        <Link
          to={
            account.role === "ADMIN" ? "/admin/inventory" : "/staff/inventory"
          }
        >
          Branch inventory
        </Link>
      )}
      <span className="eq-spacer" />
      {account ? (
        <>
          <span>{account.fullName}</span>
          <button
            onClick={() => {
              saveToken(null);
              window.location.assign("/shop");
            }}
          >
            Sign out
          </button>
        </>
      ) : (
        <Link
          to={
            "/login?returnTo=" +
            encodeURIComponent(location.pathname + location.search)
          }
        >
          Sign in
        </Link>
      )}
    </nav>
  );
}

function Frame({
  title,
  description,
  children,
  account = null,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  account?: Account | null;
}) {
  return (
    <section className="eq-page">
      <SessionLinks account={account} />
      <header className="eq-heading">
        <p>TERRAPEAK / THIẾT BỊ & TỒN KHO</p>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </header>
      {children}
    </section>
  );
}

function Message({ text }: { text: string }) {
  return text ? (
    <p role="status" className="eq-message">
      {text}
    </p>
  ) : null;
}

function Gate({
  roles,
  children,
}: {
  roles: string[];
  children: (account: Account) => React.ReactNode;
}) {
  const { loading, account, error } = useAccount();
  const location = useLocation();

  if (loading)
    return (
      <div className="eq-page" role="status">
        Đang kiểm tra tài khoản…
      </div>
    );
  if (error)
    return (
      <div className="eq-page" role="alert">
        {error}
      </div>
    );
  if (!account)
    return (
      <Navigate
        to={
          "/login?returnTo=" +
          encodeURIComponent(location.pathname + location.search)
        }
        replace
      />
    );
  if (!roles.includes(account.role))
    return (
      <Frame title="Không có quyền truy cập" account={account}>
        <p role="alert">Tài khoản không được phép mở trang này.</p>
      </Frame>
    );
  return <>{children(account)}</>;
}

function Pager({
  data,
  page,
  setPage,
  busy,
}: {
  data: Page<unknown> | null;
  page: number;
  setPage: (page: number) => void;
  busy: boolean;
}) {
  return (
    <div className="eq-actions">
      <span>
        {data?.totalElements ?? 0} results · Page {page + 1}/
        {Math.max(1, data?.totalPages ?? 0)}
      </span>
      <span className="eq-spacer" />
      <button disabled={busy || page === 0} onClick={() => setPage(page - 1)}>
        ← Previous
      </button>
      <button
        disabled={busy || !data || page + 1 >= data.totalPages}
        onClick={() => setPage(page + 1)}
      >
        Next →
      </button>
    </div>
  );
}

function getProductImage(category?: string | null, name?: string | null, id?: number): string {
  const text = `${category || ""} ${name || ""}`.toLowerCase();
  if (text.includes("lều") || text.includes("tent") || text.includes("shelter")) return images.tent;
  if (text.includes("balo") || text.includes("pack") || text.includes("bag") || text.includes("túi")) return images.pack;
  if (text.includes("gậy") || text.includes("pole") || text.includes("trek")) return images.poles;
  if (text.includes("bếp") || text.includes("nấu") || text.includes("kitchen") || text.includes("cook") || text.includes("stove")) return images.kitchen;
  if (text.includes("giày") || text.includes("boot") || text.includes("shoe")) return images.hike;
  const list = [images.tent, images.pack, images.poles, images.kitchen, images.camp, images.hike];
  return list[(id || 0) % list.length];
}

function ProductArt({ category, name, id }: { category?: string | null; name?: string | null; id?: number } = {}) {
  const imgUrl = getProductImage(category, name, id);
  return (
    <div className="w-full h-44 bg-[#EBE6DC] relative overflow-hidden rounded-xs group">
      <img
        src={imgUrl}
        alt={name || "Thiết bị TerraPeak"}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
      <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white tracking-widest uppercase bg-[#152A20]/80 px-2 py-0.5 rounded-xs backdrop-blur-xs">
        {category || "TERRAPEAK GEAR"}
      </span>
    </div>
  );
}

export function EquipmentCatalog({
  defaultMode = "all",
}: {
  defaultMode?: "all" | "buy" | "rent";
}) {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<Page<Product> | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  const categories = [
    { label: "All Categories", value: "" },
    { label: "Tents & Shelters", value: "lều" },
    { label: "Backpacks & Packs", value: "balo" },
    { label: "Trekking Poles", value: "gậy" },
    { label: "Kitchen & Stoves", value: "bếp" },
    { label: "Footwear & Boots", value: "giày" },
  ];

  const handleApplyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(0);
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (selectedCategory) params.set("category", selectedCategory);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    setQuery(params.toString());
  };

  const handleResetFilters = () => {
    setKeyword("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setPage(0);
    setQuery("");
  };

  const hasActiveFilters = Boolean(keyword || selectedCategory || minPrice || maxPrice);

  useEffect(() => {
    let alive = true;
    setBusy(true);
    setError("");
    setData(null);

    const modeParam =
      defaultMode === "all"
        ? ""
        : `&mode=${defaultMode === "buy" ? "SALE" : "RENTAL"}`;

    catalogApi<Page<Product>>(
      `/products?${query}&page=${page}&size=12${modeParam}`
    )
      .then((result) => {
        if (alive) setData(result);
      })
      .catch((e) => {
        if (alive) setError(errorText(e));
      })
      .finally(() => {
        if (alive) setBusy(false);
      });

    return () => {
      alive = false;
    };
  }, [query, page, defaultMode]);

  useEffect(() => {
    setPage(0);
    handleResetFilters();
  }, [defaultMode]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-label">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-bold text-[#5C665F]">
        <Link to="/" className="hover:text-[#111D16]">Home</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#111D16]">Equipment Armoury</span>
        {defaultMode !== "all" && (
          <>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[#D97845] uppercase">
              {defaultMode === "buy" ? "Buy Hardware" : "Rental Fleet"}
            </span>
          </>
        )}
      </div>

      {/* Hero Header Banner */}
      <div className="bg-[#152A20] text-white rounded-xs p-6 sm:p-10 relative overflow-hidden shadow-lg border border-[#2B4E3C]">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xs bg-[#2B4E3C]/90 text-emerald-400 text-[10px] font-bold tracking-widest uppercase border border-emerald-500/30">
            <Mountain className="w-3.5 h-3.5" />
            <span>TERRAPEAK EXPEDITION ARMOURY</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-headline tracking-tight text-white leading-tight">
            Field-Grade Gear & Technical Fleets
          </h1>

          <p className="text-xs sm:text-sm text-[#ADCBBB] font-body leading-relaxed max-w-2xl">
            Alpine-certified four-season shelters, carbon trekking systems, ergonomic packs, and high-output stoves. Purchase brand-new hardware with our lifetime repair guarantee, or rent field-inspected fleets from our 5 Outpost branches.
          </p>

          {/* Guarantees Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#2B4E3C] text-xs">
            <div className="flex items-center gap-2 text-[#ADCBBB]">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-bold">3-Stage Ozone Sanitized</span>
            </div>
            <div className="flex items-center gap-2 text-[#ADCBBB]">
              <Building className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-bold">5 Depot Locations</span>
            </div>
            <div className="flex items-center gap-2 text-[#ADCBBB]">
              <Package className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-bold">Factory Warranty</span>
            </div>
            <div className="flex items-center gap-2 text-[#ADCBBB]">
              <RefreshCw className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-[11px] font-bold">Easy Station Returns</span>
            </div>
          </div>
        </div>

        {/* Decorative background accent */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none hidden md:block">
          <img src={images.hero} alt="" className="w-full h-full object-cover object-right" />
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-[#D8D2C5] pb-4">
        <div className="flex items-center gap-2 bg-[#EBE6DC] p-1 rounded-xs border border-[#D8D2C5]">
          <Link
            to="/catalog"
            className={`px-4 py-2 rounded-xs font-bold text-xs uppercase tracking-wider transition ${
              defaultMode === "all"
                ? "bg-[#152A20] text-white shadow-xs"
                : "text-[#5C665F] hover:text-[#111D16]"
            }`}
          >
            All Hardware
          </Link>
          <Link
            to="/shop"
            className={`px-4 py-2 rounded-xs font-bold text-xs uppercase tracking-wider transition ${
              defaultMode === "buy"
                ? "bg-[#152A20] text-white shadow-xs"
                : "text-[#5C665F] hover:text-[#111D16]"
            }`}
          >
            Buy Gear
          </Link>
          <Link
            to="/rent"
            className={`px-4 py-2 rounded-xs font-bold text-xs uppercase tracking-wider transition ${
              defaultMode === "rent"
                ? "bg-[#D97845] text-white shadow-xs"
                : "text-[#5C665F] hover:text-[#111D16]"
            }`}
          >
            Rent Fleet
          </Link>
        </div>

        <div className="text-xs text-[#5C665F] font-bold flex items-center gap-2">
          <span>
            {busy ? "Loading inventory..." : `${data?.totalElements ?? 0} items available`}
          </span>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-[#D97845] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <form
        onSubmit={handleApplyFilters}
        className="bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs p-4 sm:p-5 shadow-xs space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Keyword Search */}
          <div className="md:col-span-5 space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#737C75] block">
              Search Gear & SKU
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#737C75] absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search tents, packs, stoves, boots..."
                className="w-full bg-white border border-[#D8D2C5] rounded-xs pl-9 pr-8 py-2 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => setKeyword("")}
                  className="absolute right-2.5 top-2.5 text-[#737C75] hover:text-[#111D16] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3 space-y-1">
            <label className="text-[10px] font-bold uppercase text-[#737C75] block">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-white border border-[#D8D2C5] rounded-xs px-3 py-2 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range (Min / Max) */}
          <div className="md:col-span-4 flex items-end gap-2">
            <div className="space-y-1 flex-1">
              <label className="text-[10px] font-bold uppercase text-[#737C75] block">
                Price (Min)
              </label>
              <input
                type="number"
                min="0"
                step="50000"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full bg-white border border-[#D8D2C5] rounded-xs px-3 py-2 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20] font-mono-spec"
              />
            </div>
            <div className="space-y-1 flex-1">
              <label className="text-[10px] font-bold uppercase text-[#737C75] block">
                Price (Max)
              </label>
              <input
                type="number"
                min="0"
                step="50000"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full bg-white border border-[#D8D2C5] rounded-xs px-3 py-2 text-xs text-[#111D16] focus:outline-none focus:border-[#152A20] font-mono-spec"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 bg-[#152A20] hover:bg-[#1E3A2D] text-white text-xs font-bold uppercase rounded-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 h-[34px]"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Quick Price Shortcuts */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#D8D2C5]/60 text-xs">
          <span className="text-[10px] font-bold uppercase text-[#737C75]">Quick Ranges:</span>
          <button
            type="button"
            onClick={() => { setMinPrice(""); setMaxPrice("500000"); }}
            className={`px-2.5 py-1 rounded-xs border text-[11px] font-bold transition cursor-pointer ${
              minPrice === "" && maxPrice === "500000"
                ? "bg-[#152A20] text-white border-[#152A20]"
                : "bg-white text-[#5C665F] border-[#D8D2C5] hover:bg-[#EBE6DC]"
            }`}
          >
            Under 500,000 ₫
          </button>
          <button
            type="button"
            onClick={() => { setMinPrice("500000"); setMaxPrice("2000000"); }}
            className={`px-2.5 py-1 rounded-xs border text-[11px] font-bold transition cursor-pointer ${
              minPrice === "500000" && maxPrice === "2000000"
                ? "bg-[#152A20] text-white border-[#152A20]"
                : "bg-white text-[#5C665F] border-[#D8D2C5] hover:bg-[#EBE6DC]"
            }`}
          >
            500,000 ₫ – 2,000,000 ₫
          </button>
          <button
            type="button"
            onClick={() => { setMinPrice("2000000"); setMaxPrice(""); }}
            className={`px-2.5 py-1 rounded-xs border text-[11px] font-bold transition cursor-pointer ${
              minPrice === "2000000" && maxPrice === ""
                ? "bg-[#152A20] text-white border-[#152A20]"
                : "bg-white text-[#5C665F] border-[#D8D2C5] hover:bg-[#EBE6DC]"
            }`}
          >
            Above 2,000,000 ₫
          </button>
        </div>
      </form>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-[#FEE2E2] border border-[#FCA5A5] rounded-xs text-xs text-[#B91C1C] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => handleApplyFilters()}
            className="font-bold underline hover:text-black cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Product Grid Area */}
      {busy ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs overflow-hidden animate-pulse flex flex-col"
            >
              <div className="h-48 bg-[#EBE6DC]" />
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-5 bg-[#EBE6DC] rounded-xs w-3/4" />
                  <div className="h-3 bg-[#EBE6DC] rounded-xs w-1/2" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="h-12 bg-[#EBE6DC] rounded-xs" />
                  <div className="h-12 bg-[#EBE6DC] rounded-xs" />
                </div>
                <div className="h-9 bg-[#EBE6DC] rounded-xs w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : data && data.content.length > 0 ? (
        /* Products Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.content.map((item) => {
            const hasSale = item.salePrice !== null;
            const hasRental = item.rentalPricePerDay !== null;

            return (
              <article
                key={item.id}
                className="bg-[#F8F6F1] border border-[#D8D2C5] hover:border-[#152A20] hover:shadow-lg rounded-xs transition-all duration-300 flex flex-col group overflow-hidden"
              >
                {/* Visual Imagery */}
                <div className="relative w-full h-48 bg-[#EBE6DC] overflow-hidden">
                  <img
                    src={getProductImage(item.category, item.name, item.id)}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                  {/* Floating Badges */}
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-xs bg-[#152A20]/90 text-white uppercase tracking-wider backdrop-blur-xs">
                      {item.category || "ALPINE GEAR"}
                    </span>
                    {hasSale && hasRental ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-xs bg-[#065F46] text-white uppercase tracking-wider shadow-xs">
                        BUY & RENT
                      </span>
                    ) : hasSale ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-xs bg-[#152A20] text-white uppercase tracking-wider shadow-xs">
                        PURCHASE ONLY
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-xs bg-[#D97845] text-white uppercase tracking-wider shadow-xs">
                        RENTAL FLEET
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-2 left-2.5 text-[10px] font-mono-spec font-bold text-white/80">
                    TP-EQ-{item.id}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3 font-label">
                  <div>
                    <h3 className="font-headline font-bold text-base text-[#111D16] group-hover:text-[#D97845] transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#5C665F]">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Ozone Sanitized
                      </span>
                      <span>•</span>
                      <span>Outpost Ready</span>
                    </div>
                  </div>

                  {/* Dual Pricing Grid */}
                  <div className="pt-2 border-t border-[#D8D2C5]/70 grid grid-cols-2 gap-2 text-xs">
                    <div
                      className={`p-2 rounded-xs border ${
                        defaultMode === "buy"
                          ? "bg-[#EBE6DC] border-[#152A20]"
                          : "bg-white border-[#D8D2C5]"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-[#737C75] uppercase block">
                        Buy Outright
                      </span>
                      <span className="font-bold text-[#111D16] font-headline text-xs block truncate">
                        {hasSale ? vnd(item.salePrice) : <span className="text-[#A39B8D]">N/A</span>}
                      </span>
                    </div>

                    <div
                      className={`p-2 rounded-xs border ${
                        defaultMode === "rent"
                          ? "bg-[#FFF8F3] border-[#D97845]"
                          : "bg-white border-[#D8D2C5]"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-[#D97845] uppercase block">
                        Rent Daily
                      </span>
                      <span className="font-bold text-[#D97845] font-headline text-xs block truncate">
                        {hasRental ? `${vnd(item.rentalPricePerDay)}/d` : <span className="text-[#A39B8D]">N/A</span>}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    to={`/gear/${item.id}`}
                    className="w-full py-2 px-3 rounded-xs bg-[#152A20] hover:bg-[#1E3A2D] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-xs group/btn cursor-pointer"
                  >
                    <span>View Specs & Reserve</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs space-y-4">
          <div className="w-14 h-14 rounded-full bg-[#EBE6DC] border border-[#D8D2C5] flex items-center justify-center mx-auto text-[#737C75]">
            <Compass className="w-7 h-7 stroke-1 text-[#152A20]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#111D16] font-headline uppercase">
              No Equipment Matches Found
            </h3>
            <p className="text-xs text-[#5C665F] font-body max-w-sm mx-auto">
              We couldn't find any equipment matching your active keyword, category, or price range.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-4 py-2 bg-[#152A20] hover:bg-[#1E3A2D] text-white text-xs font-bold uppercase rounded-xs transition shadow-xs cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Pagination Bar */}
      {data && data.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#D8D2C5] text-xs">
          <span className="text-[#5C665F] font-bold">
            Showing Page {page + 1} of {data.totalPages} ({data.totalElements} total items)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              disabled={busy || page === 0}
              onClick={() => {
                setPage((p) => Math.max(0, p - 1));
                window.scrollTo({ top: 300, behavior: "smooth" });
              }}
              className="px-3 py-1.5 rounded-xs border border-[#D8D2C5] bg-white text-[#111D16] font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBE6DC] transition flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {Array.from({ length: Math.min(5, data.totalPages) }).map((_, i) => {
              const pageNumber = i;
              return (
                <button
                  key={pageNumber}
                  disabled={busy}
                  onClick={() => {
                    setPage(pageNumber);
                    window.scrollTo({ top: 300, behavior: "smooth" });
                  }}
                  className={`w-8 h-8 rounded-xs text-xs font-bold font-mono-spec transition cursor-pointer ${
                    page === pageNumber
                      ? "bg-[#152A20] text-white border border-[#152A20]"
                      : "bg-white text-[#5C665F] border border-[#D8D2C5] hover:bg-[#EBE6DC]"
                  }`}
                >
                  {pageNumber + 1}
                </button>
              );
            })}

            <button
              disabled={busy || page + 1 >= data.totalPages}
              onClick={() => {
                setPage((p) => p + 1);
                window.scrollTo({ top: 300, behavior: "smooth" });
              }}
              className="px-3 py-1.5 rounded-xs border border-[#D8D2C5] bg-white text-[#111D16] font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#EBE6DC] transition flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function EquipmentDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setProduct(null);
    setError("");
    if (!/^[1-9]\d*$/.test(id || "")) {
      setError("Mã thiết bị không hợp lệ.");
      return;
    }
    catalogApi<Product>("/products/" + id)
      .then((p) => {
        if (alive) setProduct(p);
      })
      .catch((e) => {
        if (alive) setError(errorText(e));
      });
    return () => {
      alive = false;
    };
  }, [id]);

  if (error && !product) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-16 font-label text-center">
        <Card padding="lg" className="space-y-4 bg-[#F8F6F1]">
          <AlertCircle className="w-12 h-12 text-[#991B1B] mx-auto" />
          <h1 className="text-2xl font-bold font-headline text-[#152A20]">Không tìm thấy trang bị</h1>
          <p className="text-sm text-[#5C665F]">{error}</p>
          <div className="pt-2">
            <Link to="/shop">
              <Button variant="secondary" icon={<ArrowRight className="w-3.5 h-3.5 rotate-180" />}>
                Quay lại danh sách trang bị
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-16 font-label">
        <div className="flex flex-col items-center justify-center space-y-3 py-20">
          <RefreshCw className="w-8 h-8 text-[#D97845] animate-spin" />
          <p className="text-sm font-bold text-[#5C665F]">Đang tải thông số thiết bị dã ngoại...</p>
        </div>
      </main>
    );
  }

  const coverImg = getProductImage(product.category, product.name, product.id);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label animate-fade-in">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-[#D8D2C5]">
        <div className="flex items-center gap-2 text-xs font-bold text-[#5C665F]">
          <Link to="/" className="hover:text-[#111D16]">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link to="/shop" className="hover:text-[#111D16]">Cửa hàng trang bị</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#152A20] truncate max-w-xs">{product.name}</span>
        </div>

        <Link to="/shop">
          <Button variant="outlined" size="sm" icon={<ArrowRight className="w-3.5 h-3.5 rotate-180" />}>
            Quay lại cửa hàng
          </Button>
        </Link>
      </div>

      {/* Hero Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Product Imagery, Specs & Availability */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Product Image Banner */}
          <div className="relative rounded-xs overflow-hidden h-80 sm:h-96 bg-[#EBE6DC] shadow-md group border border-[#D8D2C5]">
            <img
              src={coverImg}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            {/* Floating Tags */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded-xs text-[10px] font-bold bg-[#152A20]/90 text-white uppercase tracking-wider backdrop-blur-xs">
                {product.category || "ALPINE GEAR"}
              </span>
              <span className="px-2.5 py-1 rounded-xs text-[10px] font-bold bg-[#D97845] text-white uppercase tracking-wider backdrop-blur-xs shadow-xs">
                CHÍNH HÃNG TERRAPEAK
              </span>
            </div>

            <div className="absolute bottom-4 left-4 right-4 text-white">
              <span className="text-[11px] font-bold tracking-widest uppercase opacity-80 block">
                MÃ SẢN PHẨM: TP-EQ-{product.id}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold font-headline leading-tight mt-0.5">
                {product.name}
              </h1>
            </div>
          </div>

          {/* Pricing Summary Card */}
          <Card padding="md" className="bg-[#F8F6F1] border border-[#D8D2C5] flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] text-[#737C75] font-bold uppercase tracking-wider block">
                GIÁ MUA SỞ HỮU MỚI
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline">
                {product.salePrice !== null ? vnd(product.salePrice) : "Chỉ cho thuê"}
              </div>
            </div>

            <div className="border-l border-[#D8D2C5] pl-6">
              <span className="text-[10px] text-[#D97845] font-bold uppercase tracking-wider block">
                GIÁ THUÊ THỰC ĐỊA
              </span>
              <div className="text-xl sm:text-2xl font-bold text-[#D97845] font-headline">
                {product.rentalPricePerDay !== null ? `${vnd(product.rentalPricePerDay)} / ngày` : "Chỉ bán"}
              </div>
            </div>
          </Card>

          {/* Equipment Quality Assurance Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xs bg-[#F8F6F1] border border-[#D8D2C5] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#059669]">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Khử trùng Ozone</span>
              </div>
              <p className="text-[11px] text-[#5C665F] leading-snug">
                Khử khuẩn tiêu chuẩn y tế tại trạm trước mỗi lần xuất kho.
              </p>
            </div>

            <div className="p-3.5 rounded-xs bg-[#F8F6F1] border border-[#D8D2C5] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#D97845]">
                <Package className="w-4 h-4 shrink-0" />
                <span>Kiểm định tải trọng</span>
              </div>
              <p className="text-[11px] text-[#5C665F] leading-snug">
                Vật liệu chống rách Ripstop, chịu thời tiết khắc nghiệt.
              </p>
            </div>

            <div className="p-3.5 rounded-xs bg-[#F8F6F1] border border-[#D8D2C5] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#152A20]">
                <Building className="w-4 h-4 shrink-0" />
                <span>3 Trạm Outpost</span>
              </div>
              <p className="text-[11px] text-[#5C665F] leading-snug">
                Nhận và hoàn trả linh hoạt tại TP.HCM, Đà Lạt, Đà Nẵng.
              </p>
            </div>
          </div>

          {/* Expedition Policy & Support */}
          <Card padding="md" className="space-y-3 bg-[#F8F6F1] border border-[#D8D2C5] text-xs">
            <h4 className="font-bold text-[#111D16] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#D97845]" /> Chính sách nhận & trả trang bị
            </h4>
            <ul className="space-y-2 text-[#5C665F] text-[11px] leading-relaxed">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Nhận đồ trực tiếp tại trạm Outpost đã chọn hoặc chuyển giao giữa các trạm.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Biên bản bàn giao kiểm kê tình trạng chi tiết đi kèm chứng nhận khử trùng.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Hỗ trợ gia hạn thời gian thuê trực tuyến nếu bạn kéo dài chuyến đi dã ngoại.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Optional Glacier Shield zero-deductible damage waiver available at checkout.</span>
              </li>
            </ul>
          </Card>
        </div>

        {/* Right Column: Sticky Order & Checkout Panel */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <OrderCheckout
            productId={product.id}
            sale={product.salePrice}
            rental={product.rentalPricePerDay}
          />
        </div>
      </div>
    </main>
  );
}

export function EquipmentAdmin() {
  return (
    <Gate roles={["ADMIN"]}>
      {(account) => <AdminCatalog account={account} />}
    </Gate>
  );
}
function AdminCatalog({ account }: { account: Account }) {
  const [data, setData] = useState<Page<Product> | null>(null),
    [page, setPage] = useState(0),
    [query, setQuery] = useState(""),
    [version, setVersion] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    setBusy(true);
    setData(null);
    catalogApi<Page<Product>>(`/admin/products?page=${page}&size=20&${query}`)
      .then((r) => {
        if (alive) {
          setData(r);
          setError("");
        }
      })
      .catch((e) => {
        if (alive) setError(errorText(e));
      })
      .finally(() => {
        if (alive) setBusy(false);
      });
    return () => {
      alive = false;
    };
  }, [page, query, version]);
  async function toggle(item: Product) {
    setBusy(true);
    try {
      await catalogApi("/admin/products/" + item.id + "/status", {
        method: "PATCH",
        body: JSON.stringify({
          status: item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
        }),
      });
      setVersion((v) => v + 1);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Frame
      title="Equipment management"
      description="Manage equipment, sale prices and daily rental rates."
      account={account}
    >
      <div className="eq-actions">
        <Link className="eq-button eq-primary" to="/admin/catalog/new">
          + Add equipment
        </Link>
      </div>
      <form
        className="eq-panel eq-filters"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(0);
          setQuery(
            new URLSearchParams(
              new FormData(e.currentTarget) as unknown as Record<
                string,
                string
              >,
            ).toString(),
          );
        }}
      >
        <label>
          Equipment name
          <input type="search" name="keyword" />
        </label>
        <label>
          Status
          <select name="status">
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </label>
        <button disabled={busy}>Search</button>
      </form>
      <Message text={error} />
      <div className="eq-panel eq-table">
        <table>
          <thead>
            <tr>
              <th>Equipment</th>
              <th>Category</th>
              <th>Sale price</th>
              <th>Rent / day</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.content.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.name}
                  <small>#{p.id}</small>
                </td>
                <td>{p.category || "—"}</td>
                <td>{vnd(p.salePrice)}</td>
                <td>{vnd(p.rentalPricePerDay)}</td>
                <td>
                  {p.status === "ACTIVE" ? "Active" : "Inactive"}
                </td>
                <td>
                  <div className="eq-actions">
                    <Link to={"/admin/catalog/" + p.id + "/edit"}>
                      Edit
                    </Link>
                    <button disabled={busy} onClick={() => toggle(p)}>
                      {p.status === "ACTIVE" ? "Inactive" : "Reactivate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {busy && <p role="status">Loading…</p>}
        {data && !data.content.length && <p>No equipment yet.</p>}
      </div>
      <Pager data={data} page={page} setPage={setPage} busy={busy} />
    </Frame>
  );
}
export function EquipmentEditor() {
  return (
    <Gate roles={["ADMIN"]}>{(account) => <Editor account={account} />}</Gate>
  );
}
function Editor({ account }: { account: Account }) {
  const { id } = useParams(),
    navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    setProduct(null);
    setError("");
    if (id)
      catalogApi<Product>("/admin/products/" + id)
        .then((p) => {
          if (alive) setProduct(p);
        })
        .catch((e) => {
          if (alive) setError(errorText(e));
        });
    return () => {
      alive = false;
    };
  }, [id]);
  return (
    <Frame
      title={id ? "Edit equipment" : "Add equipment"}
      account={account}
    >
      <Link to="/admin/catalog">← Equipment management</Link>
      <Message text={error} />
      {(!id || product) && (
        <form
          key={product?.id || "new"}
          className="eq-panel eq-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.currentTarget));
            if (!data.salePrice && !data.rentalPricePerDay) {
              setError("Enter at least one price.");
              return;
            }
            setBusy(true);
            try {
              await catalogApi("/admin/products" + (id ? "/" + id : ""), {
                method: id ? "PUT" : "POST",
                body: JSON.stringify({
                  ...data,
                  salePrice: data.salePrice || null,
                  rentalPricePerDay: data.rentalPricePerDay || null,
                }),
              });
              navigate("/admin/catalog");
            } catch (e) {
              setError(errorText(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Equipment name
            <input
              name="name"
              required
              maxLength={150}
              defaultValue={product?.name || ""}
            />
          </label>
          <label>
            Category
            <input
              name="category"
              maxLength={100}
              defaultValue={product?.category || ""}
            />
          </label>
          <div className="eq-columns">
            <label>
              Sale price (VND)
              <input
                name="salePrice"
                type="number"
                min="0"
                step="0.01"
                defaultValue={product?.salePrice ?? ""}
              />
            </label>
            <label>
              Daily rental price (VND)
              <input
                name="rentalPricePerDay"
                type="number"
                min="0"
                step="0.01"
                defaultValue={product?.rentalPricePerDay ?? ""}
              />
            </label>
          </div>
          <p>Leave the price blank if that option is unavailable.</p>
          <div className="eq-actions">
            <button className="eq-primary" disabled={busy}>
              {busy ? "Saving…" : "Save equipment"}
            </button>
            <Link to="/admin/catalog">Cancel</Link>
          </div>
        </form>
      )}
    </Frame>
  );
}
export function EquipmentInventory() {
  return (
    <Gate roles={["ADMIN", "STAFF"]}>
      {(account) => <Inventory account={account} />}
    </Gate>
  );
}
function Inventory({ account }: { account: Account }) {
  const [branches, setBranches] = useState<Branch[]>([]),
    [products, setProducts] = useState<Product[]>([]),
    [branch, setBranch] = useState(""),
    [page, setPage] = useState(0),
    [data, setData] = useState<Page<Stock> | null>(null),
    [version, setVersion] = useState(0),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(false),
    [saving, setSaving] = useState(false),
    [productId, setProductId] = useState(""),
    [operation, setOperation] = useState("import"),
    [total, setTotal] = useState("0"),
    [available, setAvailable] = useState("0");
  useEffect(() => {
    let alive = true;
    Promise.all([
      catalogApi<Branch[]>("/branches"),
      allProducts(account.role === "ADMIN"),
    ])
      .then(([b, p]) => {
        if (alive) {
          const active = b.filter((v) => v.status === "ACTIVE");
          setBranches(active);
          setProducts(p);
          if (account.role === "ADMIN") setBranch(String(active[0]?.id || ""));
        }
      })
      .catch((e) => {
        if (alive) setError(errorText(e));
      });
    return () => {
      alive = false;
    };
  }, [account.role]);
  useEffect(() => {
    let alive = true;
    setData(null);
    setError("");
    if (!branch) return;
    setLoading(true);
    catalogApi<Page<Stock>>(
      `/inventory/branches/${branch}?page=${page}&size=20`,
    )
      .then((r) => {
        if (alive) setData(r);
      })
      .catch((e) => {
        if (alive) setError(errorText(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [branch, page, version]);
  const options = new Map(products.map((p) => [p.id, p.name]));
  data?.content.forEach((s) => options.set(s.productId, s.productName));
  async function toggle(s: Stock) {
    setSaving(true);
    setMessage("");
    try {
      await catalogApi(
        `/inventory/branches/${branch}/products/${s.productId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: s.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
          }),
        },
      );
      setVersion((v) => v + 1);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setSaving(false);
    }
  }
  return (
    <Frame
      title="Branch inventory"
      description="Receive stock, reconcile inventory and track rentals. Staff can only manage assigned branches."
      account={account}
    >
      <div className="eq-panel eq-filters">
        <label>
          Branch
          <select
            disabled={saving}
            value={branch}
            onChange={(e) => {
              setBranch(e.target.value);
              setPage(0);
              setMessage("");
              setProductId("");
              setOperation("import");
            }}
          >
            <option value="">Select your assigned branch</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
        <button
          disabled={saving || loading || !branch}
          onClick={() => setVersion((v) => v + 1)}
        >
          Refresh
        </button>
      </div>
      <Message text={error || message} />
      {branch && (
        <>
          <div className="eq-panel eq-table">
            <table>
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Total quantity</th>
                  <th>Available</th>
                  <th>Rented</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.content.map((s) => (
                  <tr key={s.id}>
                    <td>{s.productName}</td>
                    <td>{s.quantityTotal}</td>
                    <td>{s.quantityAvailable}</td>
                    <td>{s.quantityRented}</td>
                    <td>
                      {s.status === "ACTIVE" ? "Active" : "Paused"}
                    </td>
                    <td>
                      <div className="eq-actions">
                        <button
                          disabled={saving}
                          onClick={() => {
                            setProductId(String(s.productId));
                            setOperation("adjust");
                            setTotal(String(s.quantityTotal));
                            setAvailable(String(s.quantityAvailable));
                          }}
                        >
                          Stocktake
                        </button>
                        <button disabled={saving} onClick={() => toggle(s)}>
                          {s.status === "ACTIVE" ? "Paused" : "Reactivate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading ? (
              <p role="status">Loading inventory…</p>
            ) : data && !data.content.length ? (
              <p>No equipment in this inventory. Select a product to receive stock.</p>
            ) : null}
          </div>
          <Pager
            data={data}
            page={page}
            setPage={setPage}
            busy={loading || saving}
          />
          <form
            className="eq-panel eq-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const values = new FormData(e.currentTarget);
              setSaving(true);
              setError("");
              setMessage("");
              try {
                await catalogApi(
                  `/inventory/branches/${branch}/products/${productId}${operation === "import" ? "/import" : ""}`,
                  {
                    method: operation === "import" ? "POST" : "PUT",
                    body: JSON.stringify(
                      operation === "import"
                        ? { quantity: Number(values.get("quantity")) }
                        : {
                            quantityTotal: Number(total),
                            quantityAvailable: Number(available),
                          },
                    ),
                  },
                );
                setVersion((v) => v + 1);
                setMessage("Inventory updated.");
              } catch (e) {
                setError(errorText(e));
              } finally {
                setSaving(false);
              }
            }}
          >
            <h2>Receive stock & stocktake</h2>
            <fieldset
              disabled={saving || loading || !data}
              className="eq-filters"
            >
              <label>
                Equipment
                <select
                  required
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                >
                  <option value="">Select equipment</option>
                  {[...options].map(([id, name]) => (
                    <option key={id} value={id}>
                      {name} (#{id})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Operation
                <select
                  value={operation}
                  onChange={(e) => setOperation(e.target.value)}
                >
                  <option value="import">Receive equipment</option>
                  <option value="adjust">Stocktake</option>
                </select>
              </label>
              {operation === "import" ? (
                <label>
                  Quantity received
                  <input
                    required
                    name="quantity"
                    type="number"
                    min="1"
                    step="1"
                    defaultValue="1"
                  />
                </label>
              ) : (
                <>
                  <label>
                    Total after stocktake
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      value={total}
                      onChange={(e) => setTotal(e.target.value)}
                    />
                  </label>
                  <label>
                    Available after stocktake
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      value={available}
                      onChange={(e) => setAvailable(e.target.value)}
                    />
                  </label>
                </>
              )}
              <button className="eq-primary">
                {saving ? "Saving…" : "Update inventory"}
              </button>
            </fieldset>
          </form>
        </>
      )}
    </Frame>
  );
}
function safeReturn(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    return url.origin === window.location.origin &&
      (/^\/(shop|rent|catalog|gear)(\/|$)/.test(url.pathname) ||
        /^\/(admin\/catalog|admin\/inventory|staff\/inventory)(\/|$)/.test(
          url.pathname,
        ))
      ? url.pathname + url.search
      : null;
  } catch {
    return null;
  }
}
export function EquipmentLogin() {
  const location = useLocation(),
    navigate = useNavigate();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="eq-page eq-login">
      <Link to="/shop">
        <Mountain /> TERRAPEAK
      </Link>
      <div className="eq-columns">
        <header className="eq-heading">
          <p>EQUIPMENT & INVENTORY</p>
          <h1>
            Every journey,
            <br />
            starts with good preparation.
          </h1>
          <p>Sign in to manage equipment and branch inventory.</p>
        </header>
        <form
          className="eq-panel eq-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const values = Object.fromEntries(new FormData(e.currentTarget));
            try {
              const result = await catalogApi<{ token: string }>(
                "/auth/login",
                { method: "POST", body: JSON.stringify(values) },
              );
              saveToken(result.token);
              const account = await catalogApi<Account>("/users/me");
              if (account.status !== "ACTIVE") {
                saveToken(null);
                throw new Error("Your account is inactive.");
              }
              navigate(
                safeReturn(
                  new URLSearchParams(location.search).get("returnTo"),
                ) ||
                  (account.role === "ADMIN"
                    ? "/admin/catalog"
                    : account.role === "STAFF"
                      ? "/staff/inventory"
                      : "/shop"),
                { replace: true },
              );
            } catch (e) {
              setError(errorText(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2>Sign in to your account</h2>
          <label>
            Email
            <input required name="email" type="email" autoComplete="username" />
          </label>
          <label>
            Password
            <input
              required
              name="password"
              type="password"
              autoComplete="current-password"
            />
          </label>
          <Message text={error} />
          <button className="eq-primary" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
