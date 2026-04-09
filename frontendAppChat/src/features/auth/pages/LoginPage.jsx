import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loginApi } from "../api/authApi";
import { Eye, EyeOff } from "lucide-react";

function Login() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      const res = await loginApi({ phone, password });
      const { token, role } = res.data;

      sessionStorage.setItem("token", token);
      sessionStorage.setItem("role", role);

      if (role === "ADMIN") navigate("/admin");
      else navigate("/chat");
    } catch (error) {
      const message = error.response?.data || "Sai tài khoản hoặc mật khẩu";
      setErrors((prev) => ({ ...prev, password: message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen flex justify-center items-center bg-white z-[9999]">
      <div className="w-[370px] p-10 bg-white rounded-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.08),0_5px_15px_rgba(0,0,0,0.04)] text-center">
        {/* LOGO BUBBLE */}
        <div className="flex justify-center mb-5">
          <div className="w-[70px] h-[70px] rounded-full bg-white flex items-center justify-center text-[35px] shadow-[inset_6px_6px_12px_#d9d9d9,inset_-6px_-6px_12px_#ffffff]">
            💬
          </div>
        </div>

        <h2 className="text-[#333] mb-2 text-2xl font-bold">
          Đăng nhập ChatApp
        </h2>
        <p className="text-[#888] text-[15px] mb-[30px]">
          Cùng kết nối và chia sẻ ngay
        </p>

        {/* PHONE INPUT */}
        <div className="text-left mb-[22px]">
          <label className="block text-[#555] mb-2 text-sm font-medium text-left">
            Số điện thoại
          </label>
          <input
            placeholder="09xx..."
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setErrors((prev) => ({ ...prev, phone: "" }));
            }}
            className="w-full px-4 py-3 rounded-[15px] border-none bg-[#f0f2f5] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] text-[#333] text-base outline-none focus:ring-2 focus:ring-[#005ae0]/20 transition-all"
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          {errors.phone && (
            <p className="text-red-500 text-[13px] mt-1 ml-1">{errors.phone}</p>
          )}
        </div>

        {/* PASSWORD INPUT */}
        <div className="text-left mb-[22px]">
          <div className="flex justify-between items-center mb-2">
            <label className="text-[#555] text-sm font-medium text-left">
              Mật khẩu
            </label>
            <span
              onClick={() => navigate("/forgot-password")}
              className="cursor-pointer text-[13px] text-[#005ae0] hover:underline"
            >
              Quên?
            </span>
          </div>

          <div className="relative flex items-center">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: "" }));
              }}
              className="w-full pl-4 pr-12 py-3.5 rounded-[15px] border-none bg-[#f0f2f5] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] text-[15px] outline-none focus:ring-2 focus:ring-[#005ae0]/20 transition-all"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <div
              className="absolute right-4 cursor-pointer p-1 rounded-full hover:bg-gray-200 transition-colors flex items-center justify-center"
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
            <p className="text-red-500 text-[13px] mt-1.5 ml-1">
              {errors.password}
            </p>
          )}
        </div>

        {/* BUTTON */}
        <div className="flex justify-center mt-[15px]">
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full py-3.5 rounded-[30px] bg-[#005ae0] text-white text-[17px] font-bold shadow-[0_10px_20px_rgba(0,90,224,0.2)] transition-all active:scale-[0.98]
              ${
                loading
                  ? "opacity-70 cursor-wait"
                  : "hover:bg-[#004bbd] cursor-pointer"
              }`}
          >
            {loading ? "Đang xác thực..." : "Đăng nhập"}
          </button>
        </div>

        <p className="text-[#888] mt-7 text-[15px]">
          Chưa có tài khoản?{" "}
          <span
            className="text-[#005ae0] font-bold cursor-pointer hover:underline ml-1"
            onClick={() => navigate("/register")}
          >
            Đăng ký ngay
          </span>
        </p>
      </div>
    </div>
  );
}
export default Login