import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Mountain,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { catalogApi, saveToken, Account, ApiError } from "../../features/equipment/catalogApi";
import { Button } from "../../components/ui";
import { ForceChangePasswordModal } from "../../components/auth/ForceChangePasswordModal";
import { doesAccountRequirePasswordChange } from "../../utils/firstLoginUtils";

function GoogleIcon({ className = "w-4 h-4 shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

interface AuthPageProps {
  defaultMode?: "login" | "register";
}

export const AuthPage: React.FC<AuthPageProps> = ({ defaultMode = "login" }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialMode = (searchParams.get("mode") as "login" | "register") || defaultMode;
  const [mode, setMode] = useState<"login" | "register">(initialMode);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regFullName, setRegFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Status state
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Pending password change on first login
  const [pendingChangePasswordUser, setPendingChangePasswordUser] = useState<Account | null>(null);

  const returnTo = searchParams.get("returnTo") || "";
  const explicitReturnTo = returnTo;

  const proceedRedirect = React.useCallback((account: Account, targetUrl?: string) => {
    setSuccessMessage(`Đăng nhập thành công! Chào mừng ${account.fullName}.`);
    const finalTarget = targetUrl || explicitReturnTo;
    setTimeout(() => {
      if (finalTarget && finalTarget !== "/login" && finalTarget !== "/oauth2/callback") {
        navigate(finalTarget, { replace: true });
      } else if (account.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else if (account.role === "STAFF") {
        navigate("/staff", { replace: true });
      } else if (account.role === "GUIDE") {
        navigate("/guide/schedules", { replace: true });
      } else {
        navigate("/passport", { replace: true });
      }
    }, 500);
  }, [explicitReturnTo, navigate]);

  // Check if token returned in URL query parameters or embedded inside returnTo
  let tokenParam = searchParams.get("token") || searchParams.get("accessToken");
  if (!tokenParam && returnTo.includes("token=")) {
    try {
      const decoded = decodeURIComponent(returnTo);
      const match = decoded.match(/[?&]token=([^&]+)/);
      if (match && match[1]) {
        tokenParam = match[1];
      }
    } catch (_) {}
  }

  React.useEffect(() => {
    if (tokenParam) {
      setBusy(true);
      setError("");
      setSuccessMessage("Đang xác thực thông tin tài khoản...");
      saveToken(tokenParam);

      let cleanTarget = explicitReturnTo;
      if (cleanTarget.includes("token=")) {
        try {
          const decoded = decodeURIComponent(cleanTarget);
          cleanTarget = decoded.split("?")[0];
        } catch (_) {}
      }

      catalogApi<Account>("/users/me")
        .then((account) => {
          if ((account.role === "STAFF" || account.role === "GUIDE") && doesAccountRequirePasswordChange(account.email)) {
            setPendingChangePasswordUser(account);
            setBusy(false);
            return;
          }
          proceedRedirect(account, cleanTarget);
        })
        .catch(() => {
          saveToken(null);
          setError("Không thể xác thực danh tính. Vui lòng thử đăng nhập lại.");
        })
        .finally(() => {
          setBusy(false);
        });
    }
  }, [tokenParam, explicitReturnTo, proceedRedirect]);

  const handleGoogleOAuthRedirect = () => {
    setBusy(true);
    setSuccessMessage("Đang chuyển hướng sang Google...");
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = await catalogApi<{ token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      saveToken(result.token);

      const account = await catalogApi<Account>("/users/me");
      if (account.status !== "ACTIVE") {
        saveToken(null);
        throw new Error("Tài khoản hiện đang bị tạm khóa hoặc chưa được kích hoạt.");
      }

      if ((account.role === "STAFF" || account.role === "GUIDE") && doesAccountRequirePasswordChange(account.email)) {
        setPendingChangePasswordUser(account);
        setBusy(false);
        return;
      }

      proceedRedirect(account);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Email hoặc mật khẩu không chính xác.");
      } else if (err instanceof Error) {
        setError(err.message || "Không thể kết nối đến máy chủ xác thực.");
      } else {
        setError("Lỗi không xác định khi đăng nhập.");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccessMessage("");

    if (regPassword.length < 6) {
      setError("Mật khẩu phải có độ dài tối thiểu 6 ký tự.");
      setBusy(false);
      return;
    }

    try {
      const payload: { fullName: string; email: string; password: string; phone?: string } = {
        fullName: regFullName,
        email: regEmail,
        password: regPassword,
      };
      if (regPhone.trim()) {
        payload.phone = regPhone.trim();
      }

      const res = await catalogApi<{ token?: string; user?: Account }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res?.token) {
        saveToken(res.token);
        setSuccessMessage(`Đăng ký thành công! Chào mừng ${regFullName}.`);
        setTimeout(() => {
          navigate(returnTo && returnTo !== "/login" ? returnTo : "/shop", { replace: true });
        }, 800);
      } else {
        setSuccessMessage(`Đăng ký tài khoản thành công! Vui lòng đăng nhập.`);
        setLoginEmail(regEmail);
        setLoginPassword(regPassword);
        setTimeout(() => {
          setMode("login");
        }, 800);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đăng ký không thành công.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3EFE6] text-[#111D16] flex flex-col justify-between font-body selection:bg-[#152A20] selection:text-[#F3EFE6]">
      {/* Top Simple Navigation Bar */}
      <header className="px-6 py-4 border-b border-[#D8D2C5] bg-[#F8F6F1] flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xs bg-[#152A20] flex items-center justify-center text-[#D97845] group-hover:bg-[#1E3A2D] transition">
            <Mountain className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-wider text-[#152A20] font-headline block">
              TERRAPEAK
            </span>
            <span className="text-[10px] text-[#7A857E] tracking-widest font-bold block uppercase">
              EXPEDITION OUTPOST
            </span>
          </div>
        </Link>

        <Link
          to="/shop"
          className="text-xs font-label text-[#5C665F] hover:text-[#152A20] font-bold uppercase transition"
        >
          ← Quay lại Storefront
        </Link>
      </header>

      {/* Main: Clean Centered Compact Auth Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-8">
        <div className="w-full max-w-md bg-[#F8F6F1] border border-[#D8D2C5] rounded-xs shadow-md p-6 sm:p-8 font-label">
          {/* Header Tabs: Đăng Nhập / Đăng Ký */}
          <div className="flex bg-[#EBE6DC] p-1 rounded-xs border border-[#D8D2C5] mb-5">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setSuccessMessage("");
              }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xs transition cursor-pointer text-center ${
                mode === "login"
                  ? "bg-[#152A20] text-[#F3EFE6] shadow-xs"
                  : "text-[#5C665F] hover:text-[#111D16]"
              }`}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
                setSuccessMessage("");
              }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-xs transition cursor-pointer text-center ${
                mode === "register"
                  ? "bg-[#152A20] text-[#F3EFE6] shadow-xs"
                  : "text-[#5C665F] hover:text-[#111D16]"
              }`}
            >
              Đăng Ký
            </button>
          </div>

          {/* Error & Success Notification Banners */}
          {error && (
            <div className="mb-4 p-3 rounded-xs bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xs bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {/* Google 1-Click Action */}
          <button
            type="button"
            onClick={handleGoogleOAuthRedirect}
            disabled={busy}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs text-xs font-bold text-[#111D16] shadow-xs hover:shadow-sm transition cursor-pointer font-label uppercase tracking-wider group"
          >
            <GoogleIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
            <span>{mode === "login" ? "Đăng nhập bằng Google" : "Đăng ký bằng Google"}</span>
          </button>

          <div className="relative flex items-center my-4">
            <div className="flex-grow border-t border-[#D8D2C5]"></div>
            <span className="shrink-0 px-3 text-[10px] text-[#7A857E] font-bold uppercase tracking-wider bg-[#F8F6F1]">
              Hoặc dùng Email
            </span>
            <div className="flex-grow border-t border-[#D8D2C5]"></div>
          </div>

          {/* MODE 1: LOGIN */}
          {mode === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                  Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-[#7A857E] absolute left-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs py-2 pl-9 pr-3 text-xs text-[#111D16] placeholder-[#7A857E] focus:outline-none focus:border-[#152A20] transition font-body"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                  Mật khẩu
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#7A857E] absolute left-3 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs py-2 pl-9 pr-10 text-xs text-[#111D16] placeholder-[#7A857E] focus:outline-none focus:border-[#152A20] transition font-body"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#7A857E] hover:text-[#152A20] cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={busy}
                  icon={busy ? undefined : <ArrowRight className="w-4 h-4" />}
                >
                  {busy ? "Đang xử lý..." : "Đăng Nhập"}
                </Button>
              </div>

              <div className="text-center pt-2 text-xs text-[#5C665F]">
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                  className="font-bold text-[#D97845] hover:underline cursor-pointer"
                >
                  Đăng ký ngay
                </button>
              </div>
            </form>
          )}

          {/* MODE 2: REGISTER */}
          {mode === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                  Họ và tên
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-[#7A857E] absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs py-2 pl-9 pr-3 text-xs text-[#111D16] placeholder-[#7A857E] focus:outline-none focus:border-[#152A20] transition font-body"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                  Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-[#7A857E] absolute left-3 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs py-2 pl-9 pr-3 text-xs text-[#111D16] placeholder-[#7A857E] focus:outline-none focus:border-[#152A20] transition font-body"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                  Số điện thoại
                </label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-[#7A857E] absolute left-3 pointer-events-none" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="0912 345 678 (tùy chọn)"
                    className="w-full bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs py-2 pl-9 pr-3 text-xs text-[#111D16] placeholder-[#7A857E] focus:outline-none focus:border-[#152A20] transition font-body"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#5C665F] block mb-1 uppercase tracking-wider">
                  Mật khẩu
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#7A857E] absolute left-3 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full bg-[#F3EFE6] border border-[#D8D2C5] rounded-xs py-2 pl-9 pr-3 text-xs text-[#111D16] placeholder-[#7A857E] focus:outline-none focus:border-[#152A20] transition font-body"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={busy}
                >
                  {busy ? "Đang xử lý..." : "Đăng Ký Tài Khoản"}
                </Button>
              </div>

              <div className="text-center pt-2 text-xs text-[#5C665F]">
                Đã có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  className="font-bold text-[#152A20] hover:underline cursor-pointer"
                >
                  Đăng nhập tại đây
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-[#D8D2C5] bg-[#F8F6F1] text-center text-xs text-[#5C665F] font-label">
        © 2026 TerraPeak Vietnam.
      </footer>

      {/* Mandatory First-Time Password Change Modal for Staff & Guide */}
      {pendingChangePasswordUser && (
        <ForceChangePasswordModal
          isOpen={!!pendingChangePasswordUser}
          userEmail={pendingChangePasswordUser.email ?? ""}
          initialCurrentPassword={loginPassword}
          onCancel={() => {
            saveToken(null);
            setPendingChangePasswordUser(null);
          }}
          onSuccess={() => {
            const acc = pendingChangePasswordUser;
            setPendingChangePasswordUser(null);
            proceedRedirect(acc);
          }}
        />
      )}
    </div>
  );
};
