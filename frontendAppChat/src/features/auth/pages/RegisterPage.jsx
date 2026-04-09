import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sendOtpApi, verifyOtpApi, registerApi } from "../api/authApi";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";

function RegisterPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [cooldowns, setCooldowns] = useState({});
  // State lưu trữ thông tin
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [birthday, setBirthday] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);

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
        if (updated[key] > 0) {
          updated[key] -= 1;
        }
      });

      return updated;
    });
  }, 1000);

  return () => clearInterval(timer);
}, []);
  

  // ================= VALIDATE LOGIC =================
  const validateBirthday = (value) => {
    if (!value) return "Vui lòng chọn ngày sinh";
    const birthDate = new Date(value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
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
    if (score <= 1) return { text: "Yếu", color: "text-red-500" };
    if (score === 2 || score === 3)
      return { text: "Trung bình", color: "text-yellow-500" };
    return { text: "Mạnh", color: "text-green-500" };
  };

  const handleChange = (field, value) => {
    let error = "";
    if (field === "email") error = validateEmail(value);
    if (field === "phone") error = validatePhone(value);
    if (field === "password") error = validatePassword(value);
    if (field === "birthday") error = validateBirthday(value);

    setErrors((prev) => ({ ...prev, [field]: error }));

    if (field === "email") setEmail(value);
    else if (field === "otp") setOtp(value);
    else if (field === "username") setUsername(value);
    else if (field === "phone") setPhone(value);
    else if (field === "gender") setGender(value);
    else if (field === "birthday") setBirthday(value);
    else if (field === "password") setPassword(value);
  };


  const handleSendOtp = async () => {
    const emailError = validateEmail(email);
    if (emailError) return setErrors({ email: emailError });

    // 👇 CHECK THEO EMAIL
    if (cooldowns[email] > 0) {
      toast.warning(`Email này cần chờ ${cooldowns[email]}s`);
      return;
    }

    setLoading(true);
    try {
      await sendOtpApi(email);

      setStep(2);
      setTimeLeft(300);

      // 👇 SET cooldown riêng cho email
      setCooldowns((prev) => ({
        ...prev,
        [email]: 60,
      }));

      setErrors({});
    } catch {
      setErrors({ email: "Gửi OTP thất bại" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (timeLeft <= 0) {
      return setErrors({ otp: "OTP đã hết hạn" });
    }
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
      await registerApi({ username, password, email, phone, gender, birthday });
      toast.success("Đăng ký thành công! 🎉");
      navigate("/login");
    } catch (err) {
      const message =
        err.response?.data || err.response?.data?.message || "Đăng ký thất bại";
      if (message.includes("Email")) {
        setErrors((prev) => ({ ...prev, email: message }));
        setStep(1);
      } else if (message.includes("SĐT")) {
        setErrors((prev) => ({ ...prev, phone: message }));
      } else if (message.includes("OTP")) {
        setErrors((prev) => ({ ...prev, otp: message }));
        setStep(2);
      } else {
        alert(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();

  // Reusable Input Class
  const inputBaseClass =
    "w-full px-[18px] py-[13px] rounded-[15px] border-none bg-[#f0f2f5] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] text-[#333] text-[15px] outline-none focus:ring-2 focus:ring-[#005ae0]/20 transition-all";

  return (
    <div className="fixed inset-0 w-screen h-screen flex justify-center items-center bg-white z-[9999]">
      <div className="w-[380px] p-10 bg-white rounded-[35px] shadow-[20px_20px_60px_#d9d9d9,-20px_-20px_60px_#ffffff] text-center">
        {/* LOGO */}
        <div className="flex justify-center mb-4">
          <div className="w-[60px] h-[60px] rounded-full bg-white flex items-center justify-center text-3xl shadow-[inset_6px_6px_12px_#d9d9d9,inset_-6px_-6px_12px_#ffffff]">
            ✨
          </div>
        </div>

        <h2 className="text-[#333] text-[22px] font-bold mb-1.5">
          Tham gia ChatApp
        </h2>
        <p className="text-[#888] text-sm mb-[25px]">
          Bước {step} / 3:{" "}
          {step === 1
            ? "Xác thực Email"
            : step === 2
            ? "Nhập mã OTP"
            : "Thông tin cá nhân"}
        </p>

        {/* STEP 1: EMAIL */}
        {step === 1 && (
          <div className="animate-in fade-in duration-500">
            <div className="text-left mb-[18px]">
              <label className="block text-[#555] mb-2 text-[13px] font-semibold ml-1.5">
                Email đăng ký
              </label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={inputBaseClass}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
              />
              {errors.email && (
                <p className="text-[#ff4d4f] text-xs mt-1.5 ml-1.5">
                  {errors.email}
                </p>
              )}
            </div>
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full py-[15px] rounded-[30px] bg-[#005ae0] text-white text-base font-bold shadow-[0_10px_20px_rgba(0,90,224,0.2)] hover:bg-[#004bbd] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-wait"
            >
              {loading ? "Đang gửi OTP..." : "Tiếp theo"}
            </button>
          </div>
        )}

        {/* STEP 2: OTP */}
        {step === 2 && (
          <div className="animate-in fade-in duration-500">
            <div className="text-left mb-[18px]">
              <label className="block text-[#555] mb-2 text-[13px] font-semibold ml-1.5">
                Mã xác thực (OTP)
              </label>

              <input
                placeholder="Nhập 6 số OTP"
                value={otp}
                onChange={(e) => handleChange("otp", e.target.value)}
                className={inputBaseClass}
                maxLength={6}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
              />

              {errors.otp && (
                <p className="text-[#ff4d4f] text-xs mt-1.5 ml-1.5">
                  {errors.otp}
                </p>
              )}

              {/* ⏱ COUNTDOWN */}
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
                  onClick={handleSendOtp}
                >
                  OTP đã hết hạn. Gửi lại?
                </p>
              )}
            </div>

            <button
              onClick={handleVerifyOtp}
              disabled={loading || timeLeft <= 0}
              className="w-full py-[15px] rounded-[30px] bg-[#005ae0] text-white text-base font-bold shadow-[0_10px_20px_rgba(0,90,224,0.2)] hover:bg-[#004bbd] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "Đang kiểm tra..." : "Xác nhận mã"}
            </button>

            {/* RESEND */}
            {cooldowns[email] > 0 ? (
              <p className="text-gray-400 text-center mt-4">
                Gửi lại sau {cooldowns[email]}s
              </p>
            ) : (
              <p
                className="text-[#005ae0] text-center mt-4 cursor-pointer"
                onClick={handleSendOtp}
              >
                Gửi lại OTP
              </p>
            )}

            <p
              className="text-[#005ae0] text-[13px] mt-2 cursor-pointer font-medium hover:underline"
              onClick={() => setStep(1)}
            >
              Quay lại nhập Email
            </p>
          </div>
        )}
        {/* STEP 3: PERSONAL INFO */}
        {step === 3 && (
          <div className="animate-in fade-in duration-500">
            <div className="max-h-[320px] overflow-y-auto pr-2.5 mb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              {/* Username */}
              <div className="text-left mb-[18px]">
                <label className="block text-[#555] mb-2 text-[13px] font-semibold ml-1.5">
                  Tên hiển thị
                </label>
                <input
                  placeholder="Họ và tên"
                  onChange={(e) => handleChange("username", e.target.value)}
                  className={inputBaseClass}
                  // Thêm Enter ở đây
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                />
                {errors.username && (
                  <p className="text-[#ff4d4f] text-xs mt-1.5 ml-1.5">
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="text-left mb-[18px]">
                <label className="block text-[#555] mb-2 text-[13px] font-semibold ml-1.5">
                  Số điện thoại
                </label>
                <input
                  placeholder="09xxxxxxxx"
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className={inputBaseClass}
                  // Thêm Enter ở đây
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                />
                {errors.phone && (
                  <p className="text-[#ff4d4f] text-xs mt-1.5 ml-1.5">
                    {errors.phone}
                  </p>
                )}
              </div>

              {/* Gender */}
              <div className="text-left mb-[18px]">
                <label className="block text-[#555] mb-2 text-[13px] font-semibold ml-1.5">
                  Giới tính
                </label>
                <select
                  onChange={(e) => handleChange("gender", e.target.value)}
                  className={inputBaseClass}
                  // Thêm Enter ở đây
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                </select>
                {errors.gender && (
                  <p className="text-[#ff4d4f] text-xs mt-1.5 ml-1.5">
                    {errors.gender}
                  </p>
                )}
              </div>

              {/* Birthday */}
              <div className="text-left mb-[18px]">
                <label className="block text-[#555] mb-2 text-[13px] font-semibold ml-1.5">
                  Ngày sinh
                </label>
                <input
                  type="date"
                  onChange={(e) => handleChange("birthday", e.target.value)}
                  className={inputBaseClass}
                  // Thêm Enter ở đây
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                />
                {errors.birthday && (
                  <p className="text-[#ff4d4f] text-xs mt-1.5 ml-1.5">
                    {errors.birthday}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="text-left mb-[18px]">
                <label className="block text-[#555] mb-2 text-[13px] font-semibold ml-1.5">
                  Mật khẩu
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Tối thiểu 6 ký tự"
                    value={password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="w-full pl-[18px] pr-12 py-[14px] rounded-[15px] border-none bg-[#f0f2f5] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] text-[15px] outline-none"
                    // Thêm Enter ở đây
                    onKeyDown={(e) => e.key === "Enter" && handleRegister()}
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
                {password && (
                  <div className="text-xs mt-1.5 ml-1.5 text-[#555]">
                    Độ mạnh:{" "}
                    <span className={`${strength.color} font-bold`}>
                      {strength.text}
                    </span>
                  </div>
                )}
                {errors.password && (
                  <p className="text-[#ff4d4f] text-xs mt-1.5 ml-1.5">
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleRegister}
              disabled={loading || Object.values(errors).some((e) => e)}
              className="w-full py-[15px] rounded-[30px] bg-[#005ae0] text-white text-base font-bold shadow-[0_10px_20px_rgba(0,90,224,0.2)] hover:bg-[#004bbd] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-wait"
            >
              {loading ? "Đang xử lý..." : "Hoàn tất đăng ký"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default RegisterPage;
