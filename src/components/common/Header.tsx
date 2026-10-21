import { useState } from "react";
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
import { storefrontAssets, storefrontBranches } from "../../data/storefront";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { account, isAuthenticated, logout } = useAuth();
  const {
    cartItems,
    setCartOpen,
    selectedStation,
    setSelectedStation,
    outposts,
  } = useAppStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isReferencePage = pathname === "/orders" || pathname === "/tours";
  const currentBranch = storefrontBranches.find(
    (b) => b.id === selectedStation.id,
  );
  const links = [
    ["/", "Home"],
    ["/shop", "Shop (Buy Gear)"],
    ["/rent", "Rent Gear"],
    ["/tours", "Tours & Events"],
    ["/orders", "My Orders"],
    ...(isReferencePage ? [["/admin", "Admin Console"]] : []),
  ];
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
            <NavLink end={to === "/"} key={to} to={to}>
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
        <button
          className="store-cart"
            onClick={() => navigate("/cart")}
            aria-label="Mở giỏ thiết bị"
        >
          <ShoppingBag size={22} />
        </button>
        <div className="relative group">
          <Link
            to={isAuthenticated ? "/passport" : "/login"}
            className="store-account flex items-center gap-2"
          >
            <img src={storefrontAssets.avatar} alt="Customer profile" />
            <span>
              <b>{isAuthenticated ? (account?.fullName || "Tài khoản") : "Đăng nhập"}</b>
              <small>{isAuthenticated ? (account?.role || "EXPLORER") : "LOGIN / REGISTER"}</small>
            </span>
          </Link>
          <div className="absolute right-0 top-full pt-1.5 hidden group-hover:block z-50 min-w-48">
            <div className="bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs shadow-lg py-1.5 text-xs font-label">
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    className="block px-3.5 py-1.5 text-[#111D16] hover:bg-[#EBE6DC] font-bold"
                  >
                    Đăng nhập (Sign In)
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3.5 py-1.5 text-[#D97845] hover:bg-[#EBE6DC] font-bold"
                  >
                    Đăng ký mới (Register)
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
                    Hồ sơ Passport
                  </Link>
                  <Link
                    to="/orders"
                    className="block px-3.5 py-1.5 text-[#5C665F] hover:bg-[#EBE6DC]"
                  >
                    Đơn thuê của tôi
                  </Link>
                  {account?.role === "ADMIN" && (
                    <Link
                      to="/admin"
                      className="block px-3.5 py-1.5 text-[#152A20] hover:bg-[#EBE6DC] font-bold"
                    >
                      Quản trị Admin HQ
                    </Link>
                  )}
                  {account && ["ADMIN", "STAFF"].includes(account.role) && (
                    <Link
                      to="/staff"
                      className="block px-3.5 py-1.5 text-[#152A20] hover:bg-[#EBE6DC] font-bold"
                    >
                      Bàn làm việc Staff
                    </Link>
                  )}
                  <div className="my-1 border-t border-[#D8D2C5]"></div>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full text-left px-3.5 py-1.5 text-red-600 hover:bg-[#EBE6DC] font-bold cursor-pointer"
                  >
                    Đăng xuất (Sign Out)
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
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </NavLink>
            ))}
            <div className="pt-2 border-t border-[#D8D2C5] my-1 flex flex-col gap-1">
              <NavLink
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="font-bold text-[#152A20]"
              >
                Đăng nhập (Sign In)
              </NavLink>
              <NavLink
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="font-bold text-[#D97845]"
              >
                Đăng ký tài khoản (Register)
              </NavLink>
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
