import { useState } from "react";
import { Link } from "react-router-dom";
import { Phone } from "lucide-react";
import { storefrontAssets, storefrontBranches } from "../../data/storefront";
export function Footer() {
  const [saved, setSaved] = useState(false);
  return (
    <footer className="store-footer">
      <div className="store-container">
        <div className="store-footer-grid">
          <div>
            <Link to="/" className="store-brand">
              <img
                className="store-logo"
                src={storefrontAssets.logo}
                alt="TerraPeak Outpost"
              />
              <strong>TERRAPEAK</strong>
            </Link>
            <p>
              Alpine-grade technical rentals, field equipment acquisition, and
              backcountry guide coordination across Vietnam highlands.
            </p>
            <div className="store-sos">
              <small>24/7 FIELD SOS DISPATCH</small>
              <a href="tel:+842888997325">
                <Phone size={17} />
                +84 (0) 28 8899 7325
              </a>
            </div>
          </div>
          <div>
            <h3>Outpost Branches</h3>
            {storefrontBranches.map((b) => (
              <div className="store-footer-branch" key={b.id}>
                <b>{b.name}</b>
                <p>
                  {b.address}
                  <br />
                  Hours: {b.hours}
                </p>
              </div>
            ))}
          </div>
          <div>
            <h3>Policies & Custody</h3>
            <ul>
              {[
                ["/waiver", "Deposit & Equipment Inspection"],
                ["/waiver", "Inclement Weather Rescheduling"],
                ["/waiver", "Damage Waiver & Loss Protocol"],
                ["/safety", "Leave No Trace Trail Principles"],
                ["/safety", "Guide Certification Standards"],
              ].map(([to, label]) => (
                <li key={label}>
                  <Link to={to}>{label}</Link>
                </li>
              ))}
            </ul>
            <div className="store-internal-links">
              <Link to="/staff">Staff Operations</Link>
              <Link to="/admin">Admin Console</Link>
            </div>
          </div>
          <div>
            <h3>Field Dispatch Bulletin</h3>
            <p>
              Receive seasonal trail conditions, new technical gear drops, and
              early booking permits.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSaved(true);
              }}
            >
              <label className="sr-only" htmlFor="dispatch-email">
                Email address
              </label>
              <input
                id="dispatch-email"
                type="email"
                required
                placeholder="explorer@domain.com"
                disabled={saved}
              />
              <button
                className="store-button store-button-orange"
                disabled={saved}
              >
                {saved ? "Preference saved" : "Subscribe Dispatch"}
              </button>
              <p role="status">
                {saved
                  ? "Saved for this preview. Email delivery is not connected."
                  : ""}
              </p>
            </form>
          </div>
        </div>
        <div className="store-footer-bottom">
          <span>
            © {new Date().getFullYear()} TerraPeak Outpost Co., Ltd. All
            technical gear specifications and expedition logs reserved.
          </span>
          <span>
            Branch Network: HCM • DLI • DAD <Link to="/waiver">Terms</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
