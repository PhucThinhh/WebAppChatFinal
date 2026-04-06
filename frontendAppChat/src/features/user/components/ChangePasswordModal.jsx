import React, { useState } from "react";
import { Eye, EyeOff, Lock, CheckCircle, X } from "lucide-react";
import { changePasswordApi } from "../api/userApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function ChangePasswordModal({ onClose }) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (value) => {
    if (!value) return "Vui lòng nhập mật khẩu";
    if (value.length < 6) return "Ít nhất 6 ký tự";
    if (!/(?=.*[A-Z])/.test(value)) return "Phải có chữ hoa";
    if (!/(?=.*\d)/.test(value)) return "Phải có số";
    if (!/(?=.*[@$!%*?&])/.test(value)) return "Phải có ký tự đặc biệt";
    return "";
  };

  const handleSubmit = async (e) => {
    // 🔥 QUAN TRỌNG: Ngăn trang web load lại khi nhấn Enter
    if (e) e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword)
      return setError("Vui lòng nhập đầy đủ.");

    if (newPassword !== confirmPassword)
      return setError("Mật khẩu không khớp.");
    
    if (oldPassword === newPassword) {
      return setError("Mật khẩu mới không được trùng mật khẩu cũ");
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) return setError(passwordError);

    setLoading(true);
    try {
      await changePasswordApi({ oldPassword, newPassword });
      toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("role");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi xác thực.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-left">
      {/* Đổi div thành form để nhận sự kiện Enter */}
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-[380px] rounded-[24px] bg-[#2a2a2a] p-6 border border-[#3e4042] transition-all"
      >
        <button
          type="button" // 🔥 Phải có type="button" để không bị nhầm là nút submit
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-[#3e4042] transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#3e4042] border border-[#4e5052]">
            <Lock size={20} className="text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-white">Đổi mật khẩu</h2>
          <p className="mt-0.5 text-xs text-gray-400">
            Cập nhật bảo mật cho tài khoản của bạn
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="ml-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Mật khẩu cũ
            </label>
            <div className="relative flex items-center">
              <input
                type={showOld ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => {
                  setOldPassword(e.target.value);
                  setError("");
                }}
                placeholder="••••••••"
                className="w-full rounded-xl bg-[#1e1e1e] border border-[#3e4042] px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-all placeholder:text-gray-600"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3.5 text-gray-500 hover:text-gray-300"
              >
                {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Mật khẩu mới
            </label>
            <div className="relative flex items-center">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError("");
                }}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full rounded-xl bg-[#1e1e1e] border border-[#3e4042] px-4 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-all placeholder:text-gray-600"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3.5 text-gray-500 hover:text-gray-300"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="ml-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Xác nhận
            </label>
            <div className="relative flex items-center">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
                placeholder="Nhập lại mật khẩu"
                className={`w-full rounded-xl bg-[#1e1e1e] border px-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-gray-600 ${
                  newPassword && newPassword === confirmPassword
                    ? "border-green-500/50"
                    : "border-[#3e4042] focus:border-blue-500"
                }`}
              />
              <div className="absolute right-3.5 flex items-center gap-2">
                {newPassword && newPassword === confirmPassword && (
                  <CheckCircle size={14} className="text-green-500" />
                )}
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="text-gray-500 hover:text-gray-300"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-3 text-center text-xs text-red-400 font-medium">
            {error}
          </p>
        )}

        <div className="mt-7 flex items-center gap-3">
          <button
            type="button" // Nút hủy không được submit form
            onClick={onClose}
            className="flex-1 rounded-xl py-2.5 text-xs font-bold text-gray-400 hover:bg-[#3e4042] hover:text-white transition-all"
          >
            Hủy bỏ
          </button>
          <button
            type="submit" // 🔥 Chuyển thành type="submit" để nhận phím Enter
            disabled={loading}
            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? "Đang lưu..." : "Xác nhận"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChangePasswordModal;
