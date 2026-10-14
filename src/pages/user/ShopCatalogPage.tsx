import React, { useState, useMemo, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { GEAR_ITEMS, OUTPOSTS } from "../../data/mockData";
import { GearCategory, ProductCapability } from "../../interfaces";
import { Card, Button, Badge, Input } from "../../components/ui";
import {
  Filter,
  Search,
  SlidersHorizontal,
  MapPin,
  Check,
  X,
  Star,
  ExternalLink,
} from "lucide-react";
import { formatCurrency, formatWeight } from "../../utils/formatters";
import { useAppStore } from "../../store/useAppStore";

interface ShopCatalogPageProps {
  defaultMode?: "all" | "rent" | "buy";
}

export const ShopCatalogPage: React.FC<ShopCatalogPageProps> = ({
  defaultMode = "all",
}) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialCategory = (searchParams.get("cat") as GearCategory) || "all";

  const { selectedStation, setSelectedGearModal } = useAppStore();

  const [category, setCategory] = useState<GearCategory>(initialCategory);
  const [capabilityFilter, setCapabilityFilter] = useState<
    "ALL" | ProductCapability
  >(
    defaultMode === "rent"
      ? "RENT_ONLY"
      : defaultMode === "buy"
        ? "BUY_ONLY"
        : "ALL",
  );
  const [search, setSearch] = useState(searchParams.get("q") || "");
  useEffect(() => {
    setSearch(new URLSearchParams(location.search).get("q") || "");
  }, [location.search]);

  const [sortBy, setSortBy] = useState<
    "featured" | "price-low" | "price-high" | "rating"
  >("featured");
  const [onlyInStockAtStation, setOnlyInStockAtStation] = useState(
    Boolean(searchParams.get("branch")),
  );
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const categories: { id: GearCategory; label: string }[] = [
    { id: "all", label: "All Equipment" },
    { id: "tents", label: "Tents & 4-Season Shelters" },
    { id: "thermal", label: "Sleeping Bags & Thermal Mats" },
    { id: "packs", label: "Alpine Assault & Haul Packs" },
    { id: "hardware", label: "Ice Tools, Axes & Crampons" },
    { id: "shells", label: "3L GORE-TEX Pro Shells" },
    { id: "navigation", label: "Satellite SOS & Telemetry" },
  ];

  const filteredGear = useMemo(() => {
    let result = [...GEAR_ITEMS];

    if (category !== "all") {
      result = result.filter((g) => g.category === category);
    }

    if (capabilityFilter !== "ALL") {
      if (capabilityFilter === "RENT_ONLY") {
        result = result.filter(
          (g) =>
            g.capability === "RENT_ONLY" || g.capability === "BUY_AND_RENT",
        );
      } else if (capabilityFilter === "BUY_ONLY") {
        result = result.filter(
          (g) => g.capability === "BUY_ONLY" || g.capability === "BUY_AND_RENT",
        );
      } else {
        result = result.filter((g) => g.capability === capabilityFilter);
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.brand.toLowerCase().includes(q) ||
          g.modelCode.toLowerCase().includes(q),
      );
    }

    if (onlyInStockAtStation) {
      result = result.filter(
        (g) => (g.stockByOutpost[selectedStation.id] || 0) > 0,
      );
    }

    // Sorting
    if (sortBy === "price-low") {
      result.sort(
        (a, b) =>
          (a.dailyRentalPrice || a.retailPrice) -
          (b.dailyRentalPrice || b.retailPrice),
      );
    } else if (sortBy === "price-high") {
      result.sort(
        (a, b) =>
          (b.retailPrice || b.dailyRentalPrice) -
          (a.retailPrice || a.dailyRentalPrice),
      );
    } else if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [
    category,
    capabilityFilter,
    search,
    sortBy,
    onlyInStockAtStation,
    selectedStation.id,
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label">
      {/* Title & Concise Introduction */}
      <div className="border-b border-[#D8D2C5] pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#D97845] uppercase tracking-wider block">
            {defaultMode === "rent"
              ? "FIELD RENTAL ARMOURY"
              : defaultMode === "buy"
                ? "RETAIL EQUIPMENT ACQUISITION"
                : "EXPEDITION GEAR CATALOG"}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111D16] font-headline mt-1">
            {defaultMode === "rent"
              ? "Alpine Gear Rentals"
              : defaultMode === "buy"
                ? "Equipment Acquisition"
                : "Field Gear Catalog"}
          </h1>
          <p className="text-xs text-[#5C665F] font-body mt-1 max-w-2xl">
            Inspected under hospital-grade autoclave sanitization protocols.
            Rent with zero-deductible Glacier Shield or purchase outright with
            full manufacturer warranty.
          </p>
        </div>

        {/* Current Branch Stock Filter Indicator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden px-3 py-2 bg-[#EBE6DC] border border-[#D8D2C5] rounded-xs text-xs font-bold text-[#152A20] flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Desktop Filter Sidebar + Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Desktop Filter Sidebar (25% column proportion) */}
        <aside className="hidden md:block md:col-span-3 space-y-5 bg-[#F8F6F1] border border-[#D8D2C5] p-5 rounded-xs">
          <div className="flex justify-between items-center pb-2 border-b border-[#D8D2C5]">
            <span className="text-xs font-bold text-[#152A20] uppercase flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#152A20]" />
              FILTERS
            </span>
            {(category !== "all" ||
              capabilityFilter !== "ALL" ||
              search ||
              onlyInStockAtStation) && (
              <button
                onClick={() => {
                  setCategory("all");
                  setCapabilityFilter("ALL");
                  setSearch("");
                  setOnlyInStockAtStation(false);
                }}
                className="text-[10px] text-[#D97845] font-bold hover:underline cursor-pointer"
              >
                RESET
              </button>
            )}
          </div>

          {/* Search Field */}
          <div>
            <label className="text-[10px] text-[#7A857E] font-bold block mb-1 uppercase">
              Search Model/Brand
            </label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. Hilleberg, Gore-Tex..."
              clearable
              onClear={() => setSearch("")}
            />
          </div>

          {/* Capability Filter: Buy & Rent / Rent Only / Buy Only */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#7A857E] font-bold block uppercase">
              Transaction Capability
            </label>
            <div className="space-y-1 text-xs">
              {[
                { id: "ALL", label: "All Capabilities" },
                { id: "RENT_ONLY", label: "Rent Only" },
                { id: "BUY_ONLY", label: "Buy Only" },
                { id: "BUY_AND_RENT", label: "Buy & Rent Both" },
              ].map((cap) => (
                <label
                  key={cap.id}
                  className="flex items-center gap-2 cursor-pointer font-medium text-[#111D16]"
                >
                  <input
                    type="radio"
                    name="capability"
                    checked={capabilityFilter === cap.id}
                    onChange={() => setCapabilityFilter(cap.id as any)}
                    className="accent-[#152A20]"
                  />
                  <span>{cap.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-1.5 pt-3 border-t border-[#D8D2C5]">
            <label className="text-[10px] text-[#7A857E] font-bold block uppercase">
              Equipment Category
            </label>
            <div className="space-y-1 text-xs">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`w-full text-left px-2 py-1.5 rounded-xs transition cursor-pointer flex justify-between items-center ${
                    category === c.id
                      ? "bg-[#152A20] text-white font-bold"
                      : "text-[#5C665F] hover:bg-[#EBE6DC]"
                  }`}
                >
                  <span className="truncate">{c.label}</span>
                  {category === c.id && (
                    <Check className="w-3.5 h-3.5 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Current Branch Availability Checkbox */}
          <div className="pt-3 border-t border-[#D8D2C5]">
            <label className="flex items-center gap-2 text-xs font-bold text-[#152A20] cursor-pointer">
              <input
                type="checkbox"
                checked={onlyInStockAtStation}
                onChange={(e) => setOnlyInStockAtStation(e.target.checked)}
                className="accent-[#152A20]"
              />
              <span>In-stock at {selectedStation.code}</span>
            </label>
            <span className="text-[10px] text-[#7A857E] block mt-0.5">
              Filter for immediate same-day depot pickup.
            </span>
          </div>
        </aside>

        {/* Product Grid (75% column proportion) */}
        <div className="md:col-span-9 space-y-4">
          {/* Top Sort & Count Bar */}
          <div className="flex justify-between items-center text-xs text-[#5C665F] bg-[#EBE6DC] p-2.5 rounded-xs border border-[#D8D2C5]">
            <span className="font-bold text-[#111D16]">
              {filteredGear.length} FIELD SPECIMENS AVAILABLE
            </span>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#7A857E] font-bold uppercase hidden sm:inline">
                SORT BY:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs px-2 py-1 text-xs text-[#111D16] font-bold"
              >
                <option value="featured">Featured Alpinism</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Guide Rating (4.9+)</option>
              </select>
            </div>
          </div>

          {/* Gear Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGear.map((item) => {
              const stock = item.stockByOutpost[selectedStation.id] || 0;
              const hasLocalStock = stock > 0;

              return (
                <Card
                  key={item.id}
                  padding="none"
                  hoverable
                  className="flex flex-col justify-between"
                >
                  <div>
                    {/* Image with badges */}
                    <div className="aspect-4/3 relative bg-[#E7E2D8] overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge
                          variant={
                            item.capability === "RENT_ONLY"
                              ? "warning"
                              : "primary"
                          }
                        >
                          {item.capability.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge variant="neutral">
                          {formatWeight(item.weightGrams)}
                        </Badge>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-[10px] font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-xs ${
                            hasLocalStock
                              ? "bg-[#F8F6F1] text-[#152A20] border border-[#D8D2C5]"
                              : "bg-[#FDF2EC] text-[#D97845] border border-[#F1BA9B]"
                          }`}
                        >
                          {hasLocalStock
                            ? `${stock} in ${selectedStation.code}`
                            : "Transfer required"}
                        </span>
                        <span className="bg-black/70 text-amber-300 px-1.5 py-0.5 rounded-xs flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-300" />
                          {item.rating}
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-4 space-y-2">
                      <span className="text-[10px] text-[#D97845] font-bold uppercase tracking-wider">
                        {item.brand}
                      </span>
                      <Link
                        to={`/gear/${item.id}${searchParams.get("start") ? `?start=${encodeURIComponent(searchParams.get("start")!)}` : ""}`}
                        className="block"
                      >
                        <h3 className="font-bold text-sm text-[#111D16] font-headline hover:text-[#D97845] transition leading-tight">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-[#5C665F] font-body line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Dual Pricing & CTA */}
                  <div className="p-4 pt-3 border-t border-[#D8D2C5] bg-[#EBE6DC]/50 space-y-3">
                    <div className="flex justify-between items-baseline text-xs">
                      {item.capability !== "BUY_ONLY" ? (
                        <div>
                          <span className="font-bold text-[#152A20] text-sm font-headline">
                            {formatCurrency(item.dailyRentalPrice)}
                          </span>
                          <span className="text-[10px] text-[#5C665F]">
                            {" "}
                            / day
                          </span>
                          <div className="text-[10px] text-[#7A857E]">
                            Bond: ${item.depositAmount}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="font-bold text-[#D97845] text-sm font-headline">
                            {formatCurrency(item.retailPrice)}
                          </span>
                          <span className="text-[10px] text-[#5C665F]">
                            {" "}
                            MSRP
                          </span>
                        </div>
                      )}

                      {item.capability === "BUY_AND_RENT" && (
                        <div className="text-right">
                          <span className="text-[11px] text-[#5C665F]">
                            Or buy:{" "}
                          </span>
                          <span className="font-bold text-[#111D16]">
                            {formatCurrency(item.retailPrice)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        to={`/gear/${item.id}${searchParams.get("start") ? `?start=${encodeURIComponent(searchParams.get("start")!)}` : ""}`}
                      >
                        <Button variant="secondary" size="sm" fullWidth>
                          Details
                        </Button>
                      </Link>
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        onClick={() => setSelectedGearModal(item)}
                      >
                        {item.capability === "BUY_ONLY"
                          ? "Acquire"
                          : "Rent / Buy"}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredGear.length === 0 && (
            <Card padding="lg" className="text-center py-16 space-y-2">
              <h3 className="text-base font-bold text-[#111D16] font-headline">
                No equipment matches selected filters
              </h3>
              <p className="text-xs text-[#5C665F]">
                Try clearing the search query or selecting "All Capabilities".
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
