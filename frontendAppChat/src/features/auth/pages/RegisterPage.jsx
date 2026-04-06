import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendOtpApi, verifyOtpApi, registerApi } from "../api/authApi";
import { Eye, EyeOff } from "lucide-react";

function RegisterPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
   const [showPassword, setShowPassword] = useState(false);

  // State lưu trữ thông tin
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [birthday, setBirthday] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({});

  // ================= VALIDATE LOGIC =================
  const validateBirthday = (value) => {
    if (!value) return "Vui lòng chọn ngày sinh";

    const birthDate = new Date(value);
    const today = new Date();

    // Tính toán số tuổi
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Kiểm tra nếu chưa tới sinh nhật trong năm hiện tại thì trừ đi 1 tuổi
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    if (age < 13) return "Bạn phải trên 13 tuổi để đăng ký";
    if (age > 100) return "Ngày sinh không hợp lệ";
    return "";
  };
  const validateEmail = (value) => {
    if (!value) return "Vui lòng nhập email";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Email không hợp lệ";
    return "";
  };

  const validatePhone = (value) => {
    if (!value) return "Vui lòng nhập số điện thoại";
    if (!/^(0|\+84)[0-9]{9}$/.test(value)) return "SĐT không hợp lệ (10 số)";
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

  const getPasswordStrength = () => {
    let score = 0;
    if (password.length >= 6) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;

    if (score <= 1) return { text: "Yếu", color: "#ff4d4f" };
    if (score === 2 || score === 3)
      return { text: "Trung bình", color: "#faad14" };
    return { text: "Mạnh", color: "#52c41a" };
  };

  // ================= HANDLE CHANGE =================
  const handleChange = (field, value) => {
    let error = "";
    if (field === "email") error = validateEmail(value);
    if (field === "phone") error = validatePhone(value);
    if (field === "password") error = validatePassword(value);
    // Thêm dòng này:
    if (field === "birthday") error = validateBirthday(value);

    setErrors((prev) => ({ ...prev, [field]: error }));

    // ... giữ nguyên phần cập nhật giá trị (setEmail, setBirthday...)
    if (field === "email") setEmail(value);
    else if (field === "otp") setOtp(value);
    else if (field === "username") setUsername(value);
    else if (field === "phone") setPhone(value);
    else if (field === "gender") setGender(value);
    else if (field === "birthday") setBirthday(value);
    else if (field === "password") setPassword(value);
  };

  // ================= API CALLS =================
  const handleSendOtp = async () => {
    const emailError = validateEmail(email);
    if (emailError) return setErrors({ email: emailError });

    setLoading(true);
    try {
      await sendOtpApi(email);
      setStep(2);
      setErrors({});
    } catch {
      setErrors({ email: "Gửi OTP thất bại" });
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
    } catch {
      setErrors({ otp: "OTP không chính xác" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    const newErrors = {
      username: !username ? "Vui lòng nhập tên" : "",
      phone: validatePhone(phone),
      password: validatePassword(password),
      gender: !gender ? "Vui lòng chọn giới tính" : "",
      birthday: validateBirthday(birthday),
    };

    setErrors(newErrors);
    if (Object.values(newErrors).some((e) => e)) return;

    setLoading(true);

    try {
      await registerApi({
        username,
        password,
        email,
        phone,
        gender,
        birthday,
      });

      alert("Đăng ký thành công! 🎉");
      navigate("/login");
    } catch (err) {
      console.log("ERROR:", err.response);

      const message =
        err.response?.data || err.response?.data?.message || "Đăng ký thất bại";

      // 🔥 map lỗi vào đúng field
      if (message.includes("Email")) {
        setErrors((prev) => ({ ...prev, email: message }));
        setStep(1); // 👈 quay lại step email
      } else if (message.includes("SĐT")) {
        setErrors((prev) => ({ ...prev, phone: message }));
      } else if (message.includes("OTP")) {
        setErrors((prev) => ({ ...prev, otp: message }));
        setStep(2);
      } else {
        alert(message); // fallback
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <div style={styles.container}>
      <div style={styles.bubbleCard}>
        <div style={styles.logoWrapper}>
          <div style={styles.logoBubble}>✨</div>
        </div>

        <h2 style={styles.title}>Tham gia ChatApp</h2>
        <p style={styles.subtitle}>
          Bước {step} / 3:{" "}
          {step === 1
            ? "Xác thực Email"
            : step === 2
            ? "Nhập mã OTP"
            : "Thông tin cá nhân"}
        </p>

        {/* STEP 1: NHẬP EMAIL */}
        {step === 1 && (
          <div style={styles.fadeAnim}>
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Email đăng ký</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => handleChange("email", e.target.value)}
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
              {loading ? "Đang gửi OTP..." : "Tiếp theo"}
            </button>
          </div>
        )}

        {/* STEP 2: NHẬP OTP */}
        {step === 2 && (
          <div style={styles.fadeAnim}>
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Mã xác thực (OTP)</label>
              <input
                placeholder="Nhập 6 số OTP"
                value={otp}
                onChange={(e) => handleChange("otp", e.target.value)}
                style={styles.input}
                maxLength={6}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
              />
              {errors.otp && <p style={styles.errorText}>{errors.otp}</p>}
            </div>
            <button
              onClick={handleVerifyOtp}
              style={styles.bubbleButton}
              disabled={loading}
            >
              {loading ? "Đang kiểm tra..." : "Xác nhận mã"}
            </button>
            <p style={styles.resendLink} onClick={() => setStep(1)}>
              Quay lại nhập Email
            </p>
          </div>
        )}

        {/* STEP 3: THÔNG TIN CÁ NHÂN */}
        {step === 3 && (
          <div style={styles.fadeAnim}>
            <div style={styles.scrollArea}>
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Tên hiển thị</label>
                <input
                  placeholder="Họ và tên"
                  onChange={(e) => handleChange("username", e.target.value)}
                  style={styles.input}
                />
                {errors.username && (
                  <p style={styles.errorText}>{errors.username}</p>
                )}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Số điện thoại</label>
                <input
                  placeholder="09xxxxxxxx"
                  onChange={(e) => handleChange("phone", e.target.value)}
                  style={styles.input}
                />
                {errors.phone && <p style={styles.errorText}>{errors.phone}</p>}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Giới tính</label>
                <select
                  onChange={(e) => handleChange("gender", e.target.value)}
                  style={styles.input}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                </select>
                {errors.gender && (
                  <p style={styles.errorText}>{errors.gender}</p>
                )}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Ngày sinh</label>
                <input
                  type="date"
                  onChange={(e) => handleChange("birthday", e.target.value)}
                  style={styles.input}
                />
                {errors.birthday && (
                  <p style={styles.errorText}>{errors.birthday}</p>
                )}
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>Mật khẩu</label>

                <div style={styles.passwordWrapper}>
                  <input
                    type={showPassword ? "text" : "password"} // Thay đổi type dựa trên state
                    placeholder="Tối thiểu 6 ký tự"
                    value={password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    style={styles.inputPassword} // Dùng style có padding-right
                  />

                  {/* Nút con mắt */}
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

                {password && (
                  <div style={styles.strengthWrapper}>
                    Độ mạnh:{" "}
                    <span style={{ color: strength.color, fontWeight: "bold" }}>
                      {strength.text}
                    </span>
                  </div>
                )}

                {errors.password && (
                  <p style={styles.errorText}>{errors.password}</p>
                )}
              </div>
            </div>

            <button
              onClick={handleRegister}
              style={styles.bubbleButton}
              disabled={loading || Object.values(errors).some((e) => e)}
            >
              {loading ? "Đang xử lý..." : "Hoàn tất đăng ký"}
            </button>
          </div>
        )}
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
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    margin: 0,
    padding: 0,
    zIndex: 9999,
  },
  bubbleCard: {
    width: "380px",
    padding: "35px 40px",
    backgroundColor: "#ffffff",
    borderRadius: "35px",
    boxShadow: "20px 20px 60px #d9d9d9, -20px -20px 60px #ffffff",
    textAlign: "center",
  },
  logoWrapper: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "15px",
  },
  logoBubble: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    backgroundColor: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "30px",
    boxShadow: "inset 6px 6px 12px #d9d9d9, inset -6px -6px 12px #ffffff",
  },
  title: {
    color: "#333",
    fontSize: "22px",
    fontWeight: "700",
    marginBottom: "5px",
  },
  subtitle: { color: "#888", fontSize: "14px", marginBottom: "25px" },
  inputGroup: { textAlign: "left", marginBottom: "18px" },
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
    padding: "13px 18px",
    borderRadius: "15px",
    border: "none",
    backgroundColor: "#f0f2f5",
    boxShadow: "inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff",
    color: "#333",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
  },
  errorText: {
    color: "#ff4d4f",
    fontSize: "12px",
    marginTop: "5px",
    marginLeft: "5px",
  },
  strengthWrapper: {
    fontSize: "12px",
    marginTop: "5px",
    marginLeft: "5px",
    color: "#555",
  },
  bubbleButton: {
    width: "100%",
    padding: "15px",
    borderRadius: "30px",
    background: "#005ae0",
    color: "white",
    border: "none",
    fontSize: "16px",
    fontWeight: "bold",
    boxShadow: "0 10px 20px rgba(0, 90, 224, 0.2)",
    cursor: "pointer",
    marginTop: "10px",
  },
  scrollArea: {
    maxHeight: "320px",
    overflowY: "auto",
    paddingRight: "10px",
    marginBottom: "15px",
    scrollbarWidth: "thin",
    scrollbarColor: "#d1d9e6 transparent",
  },
  resendLink: {
    color: "#005ae0",
    fontSize: "13px",
    marginTop: "15px",
    cursor: "pointer",
    fontWeight: "500",
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

export default RegisterPage;
