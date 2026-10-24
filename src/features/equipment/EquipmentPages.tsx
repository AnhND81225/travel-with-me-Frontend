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
  error instanceof Error ? error.message : "Không thể thực hiện yêu cầu";
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
    <nav className="eq-nav" aria-label="Thiết bị và tồn kho">
      <Link to="/shop">Equipment</Link>
      <Link to="/cart">Cart</Link>
      <Link to="/orders">My orders</Link>
      {account?.role === "ADMIN" && <Link to="/admin/orders">Manage orders</Link>}
      {account?.role === "ADMIN" && (
        <Link to="/admin/catalog">Quản lý thiết bị</Link>
      )}
      {account && ["ADMIN", "STAFF"].includes(account.role) && (
        <Link
          to={
            account.role === "ADMIN" ? "/admin/inventory" : "/staff/inventory"
          }
        >
          Tồn kho chi nhánh
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
            Đăng xuất
          </button>
        </>
      ) : (
        <Link
          to={
            "/login?returnTo=" +
            encodeURIComponent(location.pathname + location.search)
          }
        >
          Đăng nhập
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
  const { loading, account, error } = useAccount(),
    location = useLocation();
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
        {data?.totalElements ?? 0} kết quả · Trang {page + 1}/
        {Math.max(1, data?.totalPages ?? 0)}
      </span>
      <span className="eq-spacer" />
      <button disabled={busy || page === 0} onClick={() => setPage(page - 1)}>
        ← Trước
      </button>
      <button
        disabled={busy || !data || page + 1 >= data.totalPages}
        onClick={() => setPage(page + 1)}
      >
        Sau →
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
  const { account } = useAccount();
  const [page, setPage] = useState(0),
    [query, setQuery] = useState(""),
    [data, setData] = useState<Page<Product> | null>(null),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    setBusy(true);
    setError("");
    setData(null);
    catalogApi<Page<Product>>(
      "/products?" +
        query +
        `&page=${page}&size=12` +
        (defaultMode === "all"
          ? ""
          : `&mode=${defaultMode === "buy" ? "SALE" : "RENTAL"}`),
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
    setQuery("");
  }, [defaultMode]);
  return (
    <Frame
      title="Equipment"
      description="Choose Buy or Rent to find equipment for your next trip."
      account={account}
    >
      <nav aria-label="Equipment mode" className="flex gap-2 mb-4 font-label">
        <Link to="/shop" aria-current={defaultMode === "buy" ? "page" : undefined}
          className={`px-5 py-2 rounded-xs border font-bold text-xs uppercase tracking-wider transition ${defaultMode === "buy" ? "bg-[#152A20] text-white border-[#152A20]" : "bg-white text-[#152A20] border-[#D8D2C5] hover:bg-[#EBE6DC]"}`}>
          Mua thiết bị (Buy)
        </Link>
        <Link to="/rent" aria-current={defaultMode === "rent" ? "page" : undefined}
          className={`px-5 py-2 rounded-xs border font-bold text-xs uppercase tracking-wider transition ${defaultMode === "rent" ? "bg-[#152A20] text-white border-[#152A20]" : "bg-white text-[#152A20] border-[#D8D2C5] hover:bg-[#EBE6DC]"}`}>
          Thuê dã ngoại (Rent)
        </Link>
      </nav>
      <form
        className="eq-panel eq-filters font-label"
        key={defaultMode}
        onSubmit={(e) => {
          e.preventDefault();
          setPage(0);
          setQuery(
            new URLSearchParams(
              [...new FormData(e.currentTarget)].filter(
                ([, v]) => v !== "",
              ) as [string, string][],
            ).toString(),
          );
        }}
      >
        <label>
          Tìm thiết bị
          <input name="keyword" type="search" placeholder="Tên thiết bị…" />
        </label>
        <label>
          Danh mục
          <input name="category" placeholder="Ví dụ: Camping" maxLength={100} />
        </label>
        {defaultMode !== "all" && (
          <>
            <label>
              Giá từ
              <input name="minPrice" type="number" min="0" step="0.01" />
            </label>
            <label>
              Giá đến
              <input name="maxPrice" type="number" min="0" step="0.01" />
            </label>
          </>
        )}
        <button className="eq-primary font-bold" disabled={busy}>
          Tìm kiếm
        </button>
      </form>
      <Message text={error} />
      {busy ? (
        <p role="status">Đang tải thiết bị…</p>
      ) : (
        <>
          <div className="eq-grid">
            {data?.content.map((item) => (
              <article key={item.id} className="eq-panel eq-product group hover:border-[#152A20] transition shadow-xs">
                <ProductArt category={item.category} name={item.name} id={item.id} />
                <small className="text-[#D97845] font-bold uppercase tracking-wider">{item.category || "Thiết bị"}</small>
                <h2 className="font-headline font-bold text-base text-[#152A20]">{item.name}</h2>
                <p>
                  Giá bán: <strong>{vnd(item.salePrice)}</strong>
                </p>
                <p>
                  Thuê / ngày: <strong>{vnd(item.rentalPricePerDay)}</strong>
                </p>
                <Link className="eq-button font-bold text-xs" to={"/gear/" + item.id}>
                  Xem chi tiết & Đặt đồ →
                </Link>
              </article>
            ))}
          </div>
          {data && !data.content.length && <p>Không có thiết bị phù hợp.</p>}
        </>
      )}
      <Pager data={data} page={page} setPage={setPage} busy={busy} />
    </Frame>
  );
}

export function EquipmentDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState("");
  const [answer, setAnswer] = useState("");
  const [checkingStock, setCheckingStock] = useState(false);

  useEffect(() => {
    let alive = true;
    setProduct(null);
    setError("");
    if (!/^[1-9]\d*$/.test(id || "")) {
      setError("Mã thiết bị không hợp lệ.");
      return;
    }
    Promise.all([
      catalogApi<Product>("/products/" + id),
      catalogApi<Branch[]>("/branches"),
    ])
      .then(([p, b]) => {
        if (alive) {
          setProduct(p);
          setBranches(b.filter((v) => v.status === "ACTIVE"));
        }
      })
      .catch((e) => {
        if (alive) setError(errorText(e));
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

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
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 font-label animate-fade-in">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between pb-3 border-b border-[#D8D2C5]">
        <div className="flex items-center gap-2 text-xs font-bold text-[#5C665F]">
          <Link to="/" className="hover:text-[#111D16]">Trang chủ</Link>
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
        <div className="lg:col-span-7 space-y-5">
          {/* Main Product Image Banner */}
          <div className="relative rounded-xs overflow-hidden h-72 sm:h-96 bg-[#EBE6DC] shadow-md group border border-[#D8D2C5]">
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
            <div className="p-3 rounded-xs bg-[#F8F6F1] border border-[#D8D2C5] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#059669]">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Khử trùng Ozone</span>
              </div>
              <p className="text-[11px] text-[#5C665F] leading-snug">
                Khử khuẩn tiêu chuẩn y tế tại trạm trước mỗi lần xuất kho.
              </p>
            </div>

            <div className="p-3 rounded-xs bg-[#F8F6F1] border border-[#D8D2C5] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#D97845]">
                <Package className="w-4 h-4 shrink-0" />
                <span>Kiểm định tải trọng</span>
              </div>
              <p className="text-[11px] text-[#5C665F] leading-snug">
                Vật liệu chống rách Ripstop, chịu thời tiết khắc nghiệt.
              </p>
            </div>

            <div className="p-3 rounded-xs bg-[#F8F6F1] border border-[#D8D2C5] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#152A20]">
                <Building className="w-4 h-4 shrink-0" />
                <span>3 Trạm Outpost</span>
              </div>
              <p className="text-[11px] text-[#5C665F] leading-snug">
                Nhận và hoàn trả linh hoạt tại TP.HCM, Đà Lạt, Đà Nẵng.
              </p>
            </div>
          </div>

          {/* Real-time Branch Rentable Stock Checker */}
          <Card padding="md" className="space-y-4 bg-[#F8F6F1] border border-[#D8D2C5]">
            <div className="flex items-center justify-between border-b border-[#D8D2C5] pb-2.5">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#D97845]" />
                <h3 className="text-xs font-bold text-[#111D16] font-headline uppercase tracking-wider">
                  Tra cứu số lượng có thể thuê thực tế
                </h3>
              </div>
              <span className="text-[10px] text-[#737C75] font-bold">Dữ liệu kho thời gian thực</span>
            </div>

            {product.rentalPricePerDay === null ? (
              <p className="text-xs text-[#5C665F]">Trang bị này hiện chỉ hỗ trợ mua sở hữu, không áp dụng cho thuê.</p>
            ) : (
              <form
                className="space-y-3"
                onChange={() => setAnswer("")}
                onSubmit={async (e) => {
                  e.preventDefault();
                  setCheckingStock(true);
                  setAnswer("");
                  const values = new FormData(e.currentTarget);
                  const params = new URLSearchParams({
                    productId: String(product.id),
                    branchId: String(values.get("branchId")),
                    startDate: String(values.get("startDate")),
                    endDate: String(values.get("endDate")),
                  });
                  try {
                    const result = await catalogApi<{ quantityRentable: number }>(
                      "/inventory/availability?" + params
                    );
                    setAnswer(
                      `Trạm hiện có sẵn: ${result.quantityRentable} sản phẩm có thể cho thuê trong khoảng ngày này.`
                    );
                  } catch (e) {
                    setAnswer(errorText(e));
                  } finally {
                    setCheckingStock(false);
                  }
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#737C75] block mb-1">
                      Trạm kiểm tra
                    </label>
                    <select
                      name="branchId"
                      required
                      className="w-full py-2 px-2.5 bg-white border border-[#D8D2C5] rounded-xs text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
                    >
                      <option value="">-- Chọn trạm Outpost --</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#737C75] block mb-1">
                      Ngày bắt đầu
                    </label>
                    <input
                      name="startDate"
                      type="date"
                      min={minDate}
                      required
                      className="w-full py-1.5 px-2.5 bg-white border border-[#D8D2C5] rounded-xs text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#737C75] block mb-1">
                      Ngày kết thúc
                    </label>
                    <input
                      name="endDate"
                      type="date"
                      min={minDate}
                      required
                      className="w-full py-1.5 px-2.5 bg-white border border-[#D8D2C5] rounded-xs text-xs text-[#111D16] focus:outline-none focus:border-[#152A20]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Button
                    type="submit"
                    variant="secondary"
                    size="sm"
                    disabled={checkingStock || !branches.length}
                    icon={<Search className="w-3.5 h-3.5" />}
                  >
                    {checkingStock ? "Đang tra cứu kho..." : "Kiểm tra số lượng sẵn có"}
                  </Button>

                  <span className="text-[11px] text-[#737C75]">
                    Kiểm tra không giữ chỗ trước
                  </span>
                </div>

                {answer && (
                  <div className={`p-3 rounded-xs text-xs font-bold flex items-center gap-2 ${
                    answer.includes("Trạm hiện có sẵn")
                      ? "bg-[#E0EFE6] text-[#065F46] border border-[#ADCBBB]"
                      : "bg-[#FEE2E2] text-[#B91C1C] border border-[#FCA5A5]"
                  }`}>
                    {answer.includes("Trạm hiện có sẵn") ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-[#059669]" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-[#DC2626]" />
                    )}
                    <span>{answer}</span>
                  </div>
                )}
              </form>
            )}
          </Card>
        </div>

        {/* Right Column: Sticky Order & Checkout Panel */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <OrderCheckout
            productId={product.id}
            sale={product.salePrice}
            rental={product.rentalPricePerDay}
          />

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
            </ul>
          </Card>
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
      title="Quản lý thiết bị"
      description="Danh mục và giá bán, cho thuê được lưu tại backend."
      account={account}
    >
      <div className="eq-actions">
        <Link className="eq-button eq-primary" to="/admin/catalog/new">
          + Thêm thiết bị
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
          Tên thiết bị
          <input type="search" name="keyword" />
        </label>
        <label>
          Trạng thái
          <select name="status">
            <option value="">Tất cả</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Ngừng hoạt động</option>
          </select>
        </label>
        <button disabled={busy}>Tìm kiếm</button>
      </form>
      <Message text={error} />
      <div className="eq-panel eq-table">
        <table>
          <thead>
            <tr>
              <th>Thiết bị</th>
              <th>Danh mục</th>
              <th>Giá bán</th>
              <th>Thuê / ngày</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
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
                  {p.status === "ACTIVE" ? "Đang hoạt động" : "Ngừng hoạt động"}
                </td>
                <td>
                  <div className="eq-actions">
                    <Link to={"/admin/catalog/" + p.id + "/edit"}>
                      Chỉnh sửa
                    </Link>
                    <button disabled={busy} onClick={() => toggle(p)}>
                      {p.status === "ACTIVE" ? "Ngừng hoạt động" : "Mở lại"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {busy && <p role="status">Đang tải…</p>}
        {data && !data.content.length && <p>Chưa có thiết bị.</p>}
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
      title={id ? "Chỉnh sửa thiết bị" : "Thêm thiết bị"}
      account={account}
    >
      <Link to="/admin/catalog">← Quản lý thiết bị</Link>
      <Message text={error} />
      {(!id || product) && (
        <form
          key={product?.id || "new"}
          className="eq-panel eq-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.currentTarget));
            if (!data.salePrice && !data.rentalPricePerDay) {
              setError("Nhập ít nhất một loại giá.");
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
            Tên thiết bị
            <input
              name="name"
              required
              maxLength={150}
              defaultValue={product?.name || ""}
            />
          </label>
          <label>
            Danh mục
            <input
              name="category"
              maxLength={100}
              defaultValue={product?.category || ""}
            />
          </label>
          <div className="eq-columns">
            <label>
              Giá bán (VNĐ)
              <input
                name="salePrice"
                type="number"
                min="0"
                step="0.01"
                defaultValue={product?.salePrice ?? ""}
              />
            </label>
            <label>
              Giá thuê / ngày (VNĐ)
              <input
                name="rentalPricePerDay"
                type="number"
                min="0"
                step="0.01"
                defaultValue={product?.rentalPricePerDay ?? ""}
              />
            </label>
          </div>
          <p>Để trống giá nếu không hỗ trợ hình thức đó.</p>
          <div className="eq-actions">
            <button className="eq-primary" disabled={busy}>
              {busy ? "Đang lưu…" : "Lưu thiết bị"}
            </button>
            <Link to="/admin/catalog">Hủy</Link>
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
      title="Tồn kho chi nhánh"
      description="Nhập kho, kiểm kê và theo dõi số đang thuê. Nhân viên chỉ được thao tác tại chi nhánh được phân công."
      account={account}
    >
      <div className="eq-panel eq-filters">
        <label>
          Chi nhánh
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
            <option value="">Chọn chi nhánh được phân công</option>
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
          Làm mới
        </button>
      </div>
      <Message text={error || message} />
      {branch && (
        <>
          <div className="eq-panel eq-table">
            <table>
              <thead>
                <tr>
                  <th>Thiết bị</th>
                  <th>Tổng số lượng</th>
                  <th>Còn sẵn</th>
                  <th>Đang thuê</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
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
                      {s.status === "ACTIVE" ? "Đang hoạt động" : "Tạm dừng"}
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
                          Kiểm kê
                        </button>
                        <button disabled={saving} onClick={() => toggle(s)}>
                          {s.status === "ACTIVE" ? "Tạm dừng" : "Mở lại"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loading ? (
              <p role="status">Đang tải kho…</p>
            ) : data && !data.content.length ? (
              <p>Kho chưa có thiết bị. Chọn sản phẩm để nhập kho.</p>
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
                setMessage("Đã cập nhật tồn kho.");
              } catch (e) {
                setError(errorText(e));
              } finally {
                setSaving(false);
              }
            }}
          >
            <h2>Nhập kho & kiểm kê</h2>
            <fieldset
              disabled={saving || loading || !data}
              className="eq-filters"
            >
              <label>
                Thiết bị
                <select
                  required
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                >
                  <option value="">Chọn thiết bị</option>
                  {[...options].map(([id, name]) => (
                    <option key={id} value={id}>
                      {name} (#{id})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Nghiệp vụ
                <select
                  value={operation}
                  onChange={(e) => setOperation(e.target.value)}
                >
                  <option value="import">Nhập thêm thiết bị</option>
                  <option value="adjust">Kiểm kê tồn kho</option>
                </select>
              </label>
              {operation === "import" ? (
                <label>
                  Số lượng nhập
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
                    Tổng sau kiểm kê
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
                    Còn sẵn sau kiểm kê
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
                {saving ? "Đang lưu…" : "Cập nhật kho"}
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
          <p>THIẾT BỊ & TỒN KHO</p>
          <h1>
            Mỗi chuyến đi,
            <br />
            một sự chuẩn bị tốt.
          </h1>
          <p>Đăng nhập để quản lý thiết bị và kho chi nhánh.</p>
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
                throw new Error("Tài khoản không hoạt động.");
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
          <h2>Đăng nhập tài khoản</h2>
          <label>
            Email
            <input required name="email" type="email" autoComplete="username" />
          </label>
          <label>
            Mật khẩu
            <input
              required
              name="password"
              type="password"
              autoComplete="current-password"
            />
          </label>
          <Message text={error} />
          <button className="eq-primary" disabled={busy}>
            {busy ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
