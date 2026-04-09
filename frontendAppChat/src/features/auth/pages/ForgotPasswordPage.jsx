import { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";
import {
  forgotPasswordApi,
  resetPasswordApi,
  verifyOtpApi,
} from "../api/authApi";

function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [errors, setErrors] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [cooldowns, setCooldowns] = useState({});

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCooldowns((prev) => {
        const updated = { ...prev };

        Object.keys(updated).forEach((key) => {
          if (updated[key] > 0) updated[key] -= 1;
        });

        return updated;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // ================= VALIDATE =================
  const validateEmail = (value) => {
    if (!value) return "Vui lòng nhập email";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Email không hợp lệ";
    return "";
  };

  const validatePassword = (value) => {
    if (!value) return "Vui lòng nhập mật khẩu";
    if (value.length < 6) return "Ít nhất 6 ký tự";
    if (!/(?=.*[A-Z])/.test(value)) return "Phải có ít nhất 1 chữ hoa";
    if (!/(?=.*\d)/.test(value)) return "Phải có ít nhất 1 chữ số";
    if (!/(?=.*[@$!%*?&])/.test(value)) return "Phải có ký tự đặc biệt";
    return "";
  };

  // ================= HANDLE API =================
  const handleSendOtp = async () => {
    const error = validateEmail(email);
    if (error) return setErrors({ email: error });

    // 🔒 CHỐNG SPAM THEO EMAIL
    if (cooldowns[email] > 0) {
      toast.warning(`Email này cần chờ ${cooldowns[email]}s`);
      return;
    }

    setLoading(true);
    try {
      await forgotPasswordApi(email);

      setStep(2);
      setTimeLeft(300);

      // 👇 set cooldown riêng email
      setCooldowns((prev) => ({
        ...prev,
        [email]: 60,
      }));

      setErrors({});
    } catch (err) {
      const msg = err.response?.data?.message || "Email không tồn tại";
      setErrors({ email: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) return setErrors({ otp: "Vui lòng nhập OTP" });

    setLoading(true);
    try {
      await verifyOtpApi({ email, otp });
      setStep(3);
      setErrors({});
    } catch (err) {
      setErrors({ otp: err.response?.data || "OTP không đúng" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    const error = validatePassword(newPassword);
    if (error) return setErrors({ password: error });

    setLoading(true);
    try {
      await resetPasswordApi({ email, otp, newPassword });
      toast.success("Đổi mật khẩu thành công 🎉");
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data;
      if (typeof msg === "string" && msg.toLowerCase().includes("otp")) {
        setErrors({ otp: msg });
      } else {
        setErrors({ password: msg || "Có lỗi xảy ra" });
      }
    } finally {
      setLoading(false);
    }
  };

  const inputBaseClass =
    "w-full px-[18px] py-[13px] rounded-[15px] border-none bg-[#f0f2f5] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] text-[#333] text-[15px] outline-none focus:ring-2 focus:ring-[#005ae0]/20 transition-all";

  const buttonClass =
    "w-full py-[15px] rounded-[30px] bg-[#005ae0] text-white text-base font-bold shadow-[0_10px_20px_rgba(0,90,224,0.2)] hover:bg-[#004bbd] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-wait mt-4";

  return (
    <div className="fixed inset-0 w-screen h-screen flex justify-center items-center bg-white z-[9999]">
      <div className="w-[380px] p-10 bg-white rounded-[35px] shadow-[20px_20px_60px_#d9d9d9,-20px_-20px_60px_#ffffff] text-center">
        {/* LOGO */}
        <div className="flex justify-center mb-4">
          <div className="w-[60px] h-[60px] rounded-full bg-white flex items-center justify-center text-3xl shadow-[inset_6px_6px_12px_#d9d9d9,inset_-6px_-6px_12px_#ffffff]">
            🔐
          </div>
        </div>

        <h2 className="text-[#333] text-[22px] font-bold mb-1.5">
          Khôi phục mật khẩu
        </h2>
        <p className="text-[#888] text-sm mb-[25px]">
          Bước {step} / 3:{" "}
          {step === 1
            ? "Nhập Email"
            : step === 2
            ? "Xác thực OTP"
            : "Mật khẩu mới"}
        </p>

        {/* STEP 1: NHẬP EMAIL */}
        {step === 1 && (
          <div className="animate-in fade-in duration-500">
            <div className="text-left mb-[18px]">
              <label className="block text-[#555] mb-2 text-[13px] font-semibold ml-1.5">
                Email của bạn
              </label>

              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({});
                }}
                className={inputBaseClass}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
              />

              {errors.email && (
                <p className="text-[#ff4d4f] text-xs mt-1.5 ml-1.5">
                  {errors.email}
                </p>
              )}

              {/* 🔒 HIỂN THỊ COOLDOWN */}
              {cooldowns[email] > 0 && (
                <p className="text-xs text-gray-400 mt-2 ml-1.5">
                  Bạn có thể gửi lại sau {cooldowns[email]}s
                </p>
              )}
            </div>

            <button
              onClick={handleSendOtp}
              disabled={loading || cooldowns[email] > 0}
              className={`${buttonClass} ${
                cooldowns[email] > 0 ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading
                ? "Đang gửi mã..."
                : cooldowns[email] > 0
                ? `Chờ ${cooldowns[email]}s`
                : "Tiếp theo"}
            </button>
          </div>
        )}

        {/* STEP 2: NHẬP OTP */}
        {step === 2 && (
          <div className="animate-in fade-in duration-500">
            <div className="text-left mb-[18px]">
              <label className="block text-[#555] mb-2 text-[13px] font-semibold ml-1.5">
                Mã xác thực (OTP)
              </label>

              <input
                placeholder="Nhập 6 số OTP"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  setErrors({});
                }}
                className={inputBaseClass}
                maxLength={6}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
              />

              {errors.otp && (
                <p className="text-[#ff4d4f] text-xs mt-1.5 ml-1.5">
                  {errors.otp}
                </p>
              )}

              {/* ⏱ COUNTDOWN OTP */}
              {timeLeft > 0 ? (
                <p className="text-xs text-gray-500 mt-2 ml-1.5">
                  OTP hết hạn sau:{" "}
                  <span className="font-bold">
                    {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? "0" : ""}
                    {timeLeft % 60}
                  </span>
                </p>
              ) : (
                <p
                  className="text-red-500 text-xs mt-2 ml-1.5 cursor-pointer hover:underline"
                  onClick={() => {
                    if (cooldowns[email] <= 0) handleSendOtp();
                  }}
                >
                  OTP đã hết hạn. Gửi lại?
                </p>
              )}
            </div>

            {/* ✅ NÚT XÁC NHẬN OTP */}
            <button
              onClick={handleVerifyOtp}
              disabled={loading || timeLeft <= 0}
              className={buttonClass}
            >
              {loading ? "Đang kiểm tra..." : "Xác nhận mã"}
            </button>

            {/* 🔒 RESEND COOLDOWN */}
            {cooldowns[email] > 0 ? (
              <p className="text-gray-400 text-center mt-4">
                Gửi lại sau {cooldowns[email]}s
              </p>
            ) : (
              <p
                className="text-[#005ae0] text-center mt-4 cursor-pointer hover:underline font-medium"
                onClick={handleSendOtp}
              >
                Gửi lại OTP
              </p>
            )}

            {/* BACK */}
            <p
              className="text-[#005ae0] text-[13px] mt-2 cursor-pointer font-medium hover:underline"
              onClick={() => {
                setStep(1);
                setErrors({});
              }}
            >
              Quay lại nhập Email
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in duration-500">
            <div className="text-left mb-[18px]">
              <label className="block text-[#555] mb-2 text-[13px] font-semibold ml-1.5">
                Mật khẩu mới
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrors({});
                  }}
                  className={`${inputBaseClass} pr-12`}
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                />
                <div
                  className="absolute right-4 cursor-pointer p-1 rounded-full hover:bg-gray-200 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} className="text-[#888]" />
                  ) : (
                    <Eye size={20} className="text-[#888]" />
                  )}
                </div>
              </div>
              {errors.password && (
                <p className="text-[#ff4d4f] text-xs mt-1.5 ml-1.5">
                  {errors.password}
                </p>
              )}
            </div>
            <button
              onClick={handleReset}
              disabled={loading}
              className={buttonClass}
            >
              {loading ? "Đang cập nhật..." : "Đổi mật khẩu"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
