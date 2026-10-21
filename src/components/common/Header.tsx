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
import { storefrontAssets, storefrontBranches } from "../../data/storefront";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
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
        <Link to="/passport" className="store-account">
          <img src={storefrontAssets.avatar} alt="Customer profile" />
          <span>
            <b>{isReferencePage ? "Linh Nguyen" : "My account"}</b>
            <small>TRAIL SCOUT</small>
          </span>
        </Link>
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
