import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  MapPin,
  ChevronDown,
  Search,
  ShoppingBag,
  Menu,
  X,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { useAuth } from "../../hooks/useAuth";
import { publicNavigation, roleNavigation } from "../../utils/navigation";
import { storefrontAssets, storefrontBranches } from "../../data/storefront";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const { account, isAuthenticated, logout } = useAuth();
  const {
    setCartOpen,
    selectedStation,
    setSelectedStation,
    outposts,
  } = useAppStore();

  useEffect(() => {
    const updateCount = () => {
      try {
        const stored = JSON.parse(sessionStorage.getItem("treektour.order.cart") || "[]");
        const sessionCount = Array.isArray(stored)
          ? stored.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 1), 0)
          : 0;
        setCartCount(sessionCount);
      } catch {
        setCartCount(0);
      }
    };

    updateCount();
    window.addEventListener("storage", updateCount);
    window.addEventListener("cart_updated", updateCount);
    const interval = setInterval(updateCount, 1500);

    return () => {
      window.removeEventListener("storage", updateCount);
      window.removeEventListener("cart_updated", updateCount);
      clearInterval(interval);
    };
  }, []);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const navClass = (to: string, active: boolean) =>
    active || (to === "/shop" && (pathname === "/rent" || pathname === "/catalog" || pathname.startsWith("/gear/")))
      ? "active" : "";
  const currentBranch = storefrontBranches.find(b => b.id === selectedStation.id);
  const privateLinks = roleNavigation(isAuthenticated ? account?.role : undefined);
  const links = [...publicNavigation, ...privateLinks];
  const canShop = !isAuthenticated || account?.role === 'CUSTOMER';
  function search(e: React.FormEvent) {
    e.preventDefault();
    navigate(`/shop?q=${encodeURIComponent(query)}`);
    setMenuOpen(false);
  }
  return (
    <header className="store-header">
      <a className="store-skip" href="#main-content">
        Skip to content
      </a>
      <div className="store-header-inner">
        <Link to="/" className="store-brand" aria-label="TerraPeak home">
          <img
            className="store-logo"
            src={storefrontAssets.logo}
            alt="TerraPeak Outpost"
          />
          <strong>TERRAPEAK</strong>
        </Link>
        <label className="store-branch-select">
          <MapPin size={15} />
          <span className="sr-only">Select branch</span>
          <select
            value={currentBranch?.id ?? "hcmc-flagship"}
            onChange={(e) => {
              const branch = outposts.find((b) => b.id === e.target.value);
              if (branch) setSelectedStation(branch);
            }}
          >
            {storefrontBranches.map((b) => (
              <option value={b.id} key={b.id}>
                {b.short}
              </option>
            ))}
          </select>
          <ChevronDown size={13} />
        </label>
        <nav className="store-desktop-nav" aria-label="Main navigation">
          {links.map(([to, label]) => (
            <NavLink end={to === "/"} key={to} to={to} className={({ isActive }) => navClass(to, isActive)}>
              {label}
            </NavLink>
          ))}
        </nav>
        <form className="store-search" onSubmit={search}>
          <Search size={16} />
          <input
            aria-label="Search gear"
            placeholder="Search gear, trail…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" aria-label="Submit search">
            <ArrowIcon />
          </button>
        </form>
        {canShop && <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="store-cart flex items-center justify-center text-[#111D16] hover:text-[#D97845] transition-colors cursor-pointer border-0 bg-transparent"
          aria-label={`Open gear cart (${cartCount} items)`}
          title="Open gear cart"
        >
          <ShoppingBag size={22} />
          {cartCount > 0 && <span>{cartCount > 99 ? "99+" : cartCount}</span>}
        </button>}
        <div className="relative group">
          <Link
            to={isAuthenticated ? "/passport" : "/login"}
            className="store-account flex items-center gap-2"
          >
            <img src={storefrontAssets.avatar} alt="Customer profile" />
            <span>
              <b>{isAuthenticated ? (account?.fullName || "My Account") : "Sign In"}</b>
              <small>{isAuthenticated ? (account?.role || "EXPLORER") : "LOGIN / REGISTER"}</small>
            </span>
          </Link>
          <div className="absolute right-0 top-full pt-1.5 hidden group-hover:block group-focus-within:block z-50 min-w-48">
            <div className="bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs shadow-lg py-1.5 text-xs font-label">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    className="block px-3.5 py-1.5 text-[#111D16] hover:bg-[#EBE6DC] font-bold"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3.5 py-1.5 text-[#D97845] hover:bg-[#EBE6DC] font-bold"
                  >
                    Register
                  </Link>
                </>
              ) : (
                <>
                  <div className="px-3.5 py-1.5 border-b border-[#D8D2C5] mb-1 bg-[#EBE6DC]">
                    <div className="font-bold text-[#111D16] truncate">{account?.fullName}</div>
                    <div className="text-[10px] text-[#D97845] font-bold uppercase tracking-wider">{account?.role}</div>
                  </div>
                  <Link
                    to="/passport"
                    className="block px-3.5 py-1.5 text-[#5C665F] hover:bg-[#EBE6DC]"
                  >
                    My Profile
                  </Link>
                  <Link
                    to="/refunds"
                    className="block px-3.5 py-1.5 text-[#5C665F] hover:bg-[#EBE6DC]"
                  >
                    Refunds & Escrow
                  </Link>
                  {privateLinks.map(([to, label]) => (
                    <Link key={to} to={to} className="block px-3.5 py-1.5 text-[#152A20] hover:bg-[#EBE6DC] font-bold">
                      {label}
                    </Link>
                  ))}
                  <div className="my-1 border-t border-[#D8D2C5]"></div>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full text-left px-3.5 py-1.5 text-red-600 hover:bg-[#EBE6DC] font-bold cursor-pointer"
                  >
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        <button
          className="store-menu-toggle"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>
      {menuOpen && (
        <div className="store-mobile-menu">
          <nav aria-label="Mobile navigation">
            {links.map(([to, label]) => (
              <NavLink
                end={to === "/"}
                key={to}
                to={to}
                className={({ isActive }) => navClass(to, isActive)}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </NavLink>
            ))}
              {canShop && <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setCartOpen(true);
                }}
                className="flex items-center justify-between font-bold text-[#111D16] w-full text-left py-2 hover:text-[#D97845] transition cursor-pointer"
              >
                <span>Gear Cart</span>
                {cartCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-[#D97845] text-white text-[10px] rounded-xs font-mono-spec">
                    {cartCount}
                  </span>
                )}
              </button>}
              <div className="pt-2 border-t border-[#D8D2C5] my-1 flex flex-col gap-1">
              {isAuthenticated ? <>
                <NavLink to="/passport" onClick={() => setMenuOpen(false)}>My Profile</NavLink>
                <NavLink to="/refunds" onClick={() => setMenuOpen(false)}>Refunds & Escrow</NavLink>
                <button type="button" onClick={logout} className="text-left font-bold text-red-600">Sign Out</button>
              </> : <>
                <NavLink to="/login" onClick={() => setMenuOpen(false)}>Sign In</NavLink>
                <NavLink to="/register" onClick={() => setMenuOpen(false)}>Register</NavLink>
              </>}
            </div>
          </nav>
          <form onSubmit={search}>
            <input
              aria-label="Search gear on mobile"
              placeholder="Search gear…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="store-button" type="submit">
              Search <Search size={14} />
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
function ArrowIcon() {
  return <span aria-hidden="true">↵</span>;
}
