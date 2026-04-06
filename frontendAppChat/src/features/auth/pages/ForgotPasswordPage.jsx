import { useState } from "react";
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

  // ================= BƯỚC 1: GỬI OTP =================
  const handleSendOtp = async () => {
    const error = validateEmail(email);
    if (error) return setErrors({ email: error });

    setLoading(true);
    try {
      // Gọi API quên mật khẩu
      await forgotPasswordApi(email);
      setStep(2);
      setErrors({});
    } catch (err) {
      // Lấy message lỗi từ backend trả về
      const msg =
        err.response?.data?.message || "Email không tồn tại hoặc lỗi hệ thống";
      setErrors({ email: msg });
    } finally {
      setLoading(false);
    }
  };

  // ================= BƯỚC 2: KIỂM TRA OTP TẠI CHỖ =================
  const handleVerifyOtp = async () => {
    if (!otp) return setErrors({ otp: "Nhập OTP" });

    setLoading(true);
    try {
      await verifyOtpApi({
        email,
        otp,
      });

      setStep(3); // ✅ chỉ khi OTP đúng mới qua
      setErrors({});
    } catch (err) {
      setErrors({
        otp: err.response?.data || "OTP không đúng",
      });
    } finally {
      setLoading(false);
    }
  };

  // ================= BƯỚC 3: ĐẶT LẠI MẬT KHẨU =================
  const handleReset = async () => {
    // 🔥 validate trước
    const error = validatePassword(newPassword);
    if (error) return setErrors({ password: error });

    setLoading(true);
    try {
      await resetPasswordApi({
        email,
        otp,
        newPassword,
      });

      toast.success("Đổi mật khẩu thành công 🎉");
      navigate("/login");
    } catch (err) {
      const msg = err.response?.data;

      // 🔥 FIX: phân biệt lỗi OTP vs password
      if (msg?.toLowerCase().includes("otp")) {
        setErrors({ otp: msg });
      } else {
        setErrors({ password: msg || "Có lỗi xảy ra" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bubbleCard}>
        <div style={styles.logoWrapper}>
          <div style={styles.logoBubble}>🔐</div>
        </div>

        <h2 style={styles.title}>Quên mật khẩu</h2>
        <p style={styles.subtitle}>
          Bước {step} / 3:{" "}
          {step === 1
            ? "Nhập Email"
            : step === 2
            ? "Nhập OTP"
            : "Đặt mật khẩu mới"}
        </p>

        {/* STEP 1: Nhập Email */}
        {step === 1 && (
          <div style={styles.fadeAnim}>
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Email của bạn</label>
              <input
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({});
                }}
                style={styles.input}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
              />
              {errors.email && <p style={styles.errorText}>{errors.email}</p>}
            </div>
            <button
              onClick={handleSendOtp}
              style={styles.bubbleButton}
              disabled={loading}
            >
              {loading ? "Đang gửi mã..." : "Gửi mã xác nhận"}
            </button>
          </div>
        )}

        {/* STEP 2: Nhập OTP */}
        {step === 2 && (
          <div style={styles.fadeAnim}>
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Nhập mã OTP</label>
              <input
                placeholder="Nhập mã 6 số"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  setErrors({});
                }}
                style={styles.input}
                maxLength={6}
              />
              {errors.otp && <p style={styles.errorText}>{errors.otp}</p>}
            </div>
            <button onClick={handleVerifyOtp} style={styles.bubbleButton}>
              Tiếp tục
            </button>
            <p style={styles.resendLink} onClick={() => setStep(1)}>
              Nhập sai Email? Quay lại
            </p>
          </div>
        )}

        {/* STEP 3: Mật khẩu mới */}
        {step === 3 && (
          <div style={styles.fadeAnim}>
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Mật khẩu mới</label>

              <div style={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"} // 🔥 Thay đổi type dựa trên state
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrors({});
                  }}
                  style={styles.inputPassword}
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                />

                {/* 🔥 Nút con mắt */}
                <div
                  style={styles.eyeIcon}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#888" />
                  ) : (
                    <Eye size={20} color="#888" />
                  )}
                </div>
              </div>

              {errors.password && (
                <p style={styles.errorText}>{errors.password}</p>
              )}
            </div>
            <button
              onClick={handleReset}
              style={styles.bubbleButton}
              disabled={loading}
            >
              {loading ? "Đang cập nhật..." : "Đổi mật khẩu"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#ffffff",
    fontFamily: "'Segoe UI', Roboto, sans-serif",
  },
  bubbleCard: {
    width: "380px",
    padding: "40px",
    borderRadius: "35px",
    backgroundColor: "#ffffff",
    boxShadow: "20px 20px 60px #d9d9d9, -20px -20px 60px #ffffff",
    textAlign: "center",
  },
  logoWrapper: { marginBottom: "20px" },
  logoBubble: {
    width: "65px",
    height: "65px",
    borderRadius: "50%",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
    backgroundColor: "#ffffff",
    boxShadow: "inset 6px 6px 12px #d9d9d9, inset -6px -6px 12px #ffffff",
  },
  title: {
    fontSize: "22px",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "5px",
  },
  subtitle: { fontSize: "14px", color: "#888", marginBottom: "30px" },
  inputGroup: { textAlign: "left", marginBottom: "15px" },
  inputLabel: {
    display: "block",
    color: "#555",
    marginBottom: "8px",
    fontSize: "13px",
    fontWeight: "600",
    marginLeft: "5px",
  },
  input: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: "15px",
    border: "none",
    background: "#f0f2f5",
    boxShadow: "inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff",
    fontSize: "15px",
    boxSizing: "border-box",
    outline: "none",
  },
  bubbleButton: {
    width: "100%",
    padding: "15px",
    borderRadius: "30px",
    background: "#005ae0",
    color: "#fff",
    border: "none",
    marginTop: "15px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
    boxShadow: "0 10px 20px rgba(0, 90, 224, 0.2)",
  },
  errorText: {
    color: "#ff4d4f",
    fontSize: "12px",
    marginTop: "5px",
    marginLeft: "5px",
  },
  resendLink: {
    marginTop: "20px",
    color: "#005ae0",
    cursor: "pointer",
    fontSize: "13px",
    textDecoration: "underline",
  },
  fadeAnim: { animation: "fadeIn 0.5s ease" },

  passwordWrapper: {
    position: "relative", // Để icon có thể đặt đè lên input
    display: "flex",
    alignItems: "center",
  },
  inputPassword: {
    width: "100%",
    padding: "14px 50px 14px 18px", // Padding phải rộng hơn để không bị chữ đè lên icon
    borderRadius: "15px",
    border: "none",
    background: "#f0f2f5",
    boxShadow: "inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff",
    fontSize: "15px",
    boxSizing: "border-box",
    outline: "none",
  },
  eyeIcon: {
    position: "absolute",
    right: "15px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "5px",
    borderRadius: "50%",
    transition: "0.2s",
    // Hiệu ứng nhẹ khi hover
    ":hover": {
      backgroundColor: "#e0e0e0",
    },
  },
};


export default ForgotPasswordPage;
