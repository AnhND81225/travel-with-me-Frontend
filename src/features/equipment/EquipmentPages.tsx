import React, { useEffect, useState } from "react";
import { OrderCheckout } from "../orders/OrderCheckout";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { Mountain } from "lucide-react";
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
      <Link to="/shop">Mua thiết bị</Link>
      <Link to="/rent">Thuê thiết bị</Link>
      <Link to="/cart">Giỏ hàng</Link>
      <Link to="/orders">Đơn của tôi</Link>
      {account?.role === "ADMIN" && <Link to="/admin/orders">Vận hành đơn hàng</Link>}
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
function ProductArt() {
  return (
    <div className="eq-art">
      <Mountain size={80} strokeWidth={1} />
      <span>TERRAPEAK EQUIPMENT</span>
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
      title={
        defaultMode === "rent"
          ? "Thuê thiết bị cho chuyến đi"
          : "Thiết bị cho chuyến đi"
      }
      description="Chọn thiết bị, xem giá và tra cứu lượng có thể thuê tại chi nhánh."
      account={account}
    >
      <form
        className="eq-panel eq-filters"
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
        <button className="eq-primary" disabled={busy}>
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
              <article key={item.id} className="eq-panel eq-product">
                <ProductArt />
                <small>{item.category || "Thiết bị"}</small>
                <h2>{item.name}</h2>
                <p>
                  Giá bán: <strong>{vnd(item.salePrice)}</strong>
                </p>
                <p>
                  Thuê / ngày: <strong>{vnd(item.rentalPricePerDay)}</strong>
                </p>
                <Link className="eq-button" to={"/gear/" + item.id}>
                  Xem chi tiết →
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
  const { id } = useParams(),
    { account } = useAccount();
  const [product, setProduct] = useState<Product | null>(null),
    [branches, setBranches] = useState<Branch[]>([]),
    [error, setError] = useState(""),
    [answer, setAnswer] = useState(""),
    [busy, setBusy] = useState(false);
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
  return (
    <Frame title={product?.name || "Chi tiết thiết bị"} account={account}>
      <Link to="/shop">← Danh sách thiết bị</Link>
      <Message text={error} />
      {product && (
        <div className="eq-columns">
          <article className="eq-panel">
            <ProductArt />
            <h2>{product.category || "Thiết bị"}</h2>
            <p>
              Giá bán: <strong>{vnd(product.salePrice)}</strong>
            </p>
            <p>
              Thuê / ngày: <strong>{vnd(product.rentalPricePerDay)}</strong>
            </p>
          </article>
          <OrderCheckout productId={product.id} sale={product.salePrice} rental={product.rentalPricePerDay} />
          <form
            className="eq-panel eq-form"
            onChange={() => setAnswer("")}
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setAnswer("");
              const values = new FormData(e.currentTarget),
                params = new URLSearchParams({
                  productId: String(product.id),
                  branchId: String(values.get("branchId")),
                  startDate: String(values.get("startDate")),
                  endDate: String(values.get("endDate")),
                });
              try {
                const result = await catalogApi<{ quantityRentable: number }>(
                  "/inventory/availability?" + params,
                );
                setAnswer(
                  `Có thể thuê: ${result.quantityRentable} thiết bị trong khoảng ngày đã chọn.`,
                );
              } catch (e) {
                setAnswer(errorText(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            <h2>Kiểm tra lượng có thể thuê</h2>
            {product.rentalPricePerDay === null ? (
              <p>Thiết bị này không hỗ trợ thuê.</p>
            ) : (
              <>
                <label>
                  Chi nhánh
                  <select required name="branchId">
                    <option value="">Chọn chi nhánh</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Ngày nhận
                  <input required name="startDate" type="date" min={minDate} />
                </label>
                <label>
                  Ngày trả
                  <input required name="endDate" type="date" min={minDate} />
                </label>
                <button
                  disabled={busy || !branches.length}
                  className="eq-primary"
                >
                  {busy ? "Đang kiểm tra…" : "Kiểm tra tồn kho"}
                </button>
                <Message text={answer} />
                <p className="eq-note">
                  Kết quả tra cứu chưa giữ chỗ. Đặt hàng và thanh toán sẽ được
                  nối với module đơn hàng.
                </p>
              </>
            )}
          </form>
        </div>
      )}
    </Frame>
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
