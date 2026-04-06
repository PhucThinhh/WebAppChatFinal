import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginApi } from "../api/authApi";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 🔥 thêm error
  const [errors, setErrors] = useState({
    phone: "",
    password: "",
  });

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const role = sessionStorage.getItem("role");

    if (token && role) {
      if (role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/chat");
      }
    }
  }, [navigate]);

  // 🔥 validate
  const validate = () => {
    const newErrors = {
      phone: !phone ? "Vui lòng nhập SĐT" : "",
      password: !password ? "Vui lòng nhập mật khẩu" : "",
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some((e) => e);
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);

    try {
      const res = await loginApi({
        phone,
        password,
      });

      const token = res.data.token;
      const role = res.data.role;

      sessionStorage.setItem("token", token);
      sessionStorage.setItem("role", role);

      if (role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/chat");
      }
    } catch (error) {
      console.log(error);

      const message = error.response?.data || "Sai tài khoản hoặc mật khẩu";

      setErrors((prev) => ({
        ...prev,
        password: message, // 👈 show lỗi ở password
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bubbleCard}>
        <div style={styles.logoWrapper}>
          <div style={styles.logoBubble}>💬</div>
        </div>

        <h2 style={styles.title}>Đăng nhập ChatApp</h2>
        <p style={styles.subtitle}>Cùng kết nối và chia sẻ ngay</p>

        {/* PHONE */}
        <div style={styles.inputGroup}>
          <label style={styles.inputLabel}>Số điện thoại</label>
          <input
            placeholder="09xx..."
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setErrors((prev) => ({ ...prev, phone: "" }));
            }}
            style={styles.input}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          {errors.phone && (
            <p style={{ color: "red", fontSize: "13px" }}>{errors.phone}</p>
          )}
        </div>

        {/* PASSWORD */}
        <div style={styles.inputGroup}>
          <div style={styles.labelHeader}>
            <label style={styles.inputLabel}>Mật khẩu</label>
            <span
              onClick={() => navigate("/forgot-password")}
              style={{ cursor: "pointer", fontSize: "13px", color: "#005ae0" }}
            >
              Quên?
            </span>
          </div>

          <div style={styles.passwordWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: "" }));
              }}
              style={styles.inputPassword} // Dùng style riêng cho input có icon
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />

            {/* Icon con mắt */}
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
            <p style={{ color: "red", fontSize: "13px", marginTop: "5px" }}>
              {errors.password}
            </p>
          )}
        </div>

        {/* BUTTON */}
        <div style={styles.btnWrapper}>
          <button
            onClick={handleLogin}
            style={{
              ...styles.bubbleButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "wait" : "pointer",
            }}
            disabled={loading}
          >
            {loading ? "Đang xác thực..." : "Đăng nhập"}
          </button>
        </div>

        <p style={styles.footerText}>
          Chưa có tài khoản?{" "}
          <span style={styles.link} onClick={() => navigate("/register")}>
            Đăng ký ngay
          </span>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    margin: 0,
    padding: 0,
    zIndex: 9999,
  },

  bubbleCard: {
    width: "370px",
    padding: "35px 40px 40px 40px",
    backgroundColor: "#ffffff",
    borderRadius: "30px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.08), 0 5px 15px rgba(0,0,0,0.04)",
    textAlign: "center",
  },

  logoWrapper: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "20px",
  },
  logoBubble: {
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    backgroundColor: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "35px",
    boxShadow: "inset 6px 6px 12px #d9d9d9, inset -6px -6px 12px #ffffff",
  },

  title: {
    color: "#333",
    marginBottom: "8px",
    fontSize: "24px",
    fontWeight: "700",
  },
  subtitle: { color: "#888", fontSize: "15px", marginBottom: "30px" },

  inputGroup: { textAlign: "left", marginBottom: "22px" },
  inputLabel: {
    display: "block",
    color: "#555",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "500",
  },
  labelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgot: {
    color: "#005ae0",
    fontSize: "13px",
    cursor: "pointer",
    marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "15px",
    border: "none",
    backgroundColor: "#f0f2f5",
    boxShadow: "inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff",
    color: "#333",
    fontSize: "16px",
    outline: "none",
    boxSizing: "border-box",
  },

  btnWrapper: {
    display: "flex",
    justifyContent: "center",
    marginTop: "15px",
  },
  bubbleButton: {
    width: "100%",
    padding: "14px",
    borderRadius: "30px",
    background: "#005ae0",
    color: "white",
    border: "none",
    fontSize: "17px",
    fontWeight: "bold",
    boxShadow: "0 10px 20px rgba(0, 90, 224, 0.2)",
    cursor: "pointer",
  },

  footerText: { color: "#888", marginTop: "28px", fontSize: "15px" },
  link: { color: "#005ae0", fontWeight: "bold", cursor: "pointer" },

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
    }
  },
};
