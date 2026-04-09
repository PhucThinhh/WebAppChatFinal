import axiosClient from "../../../shared/api/axios";

// 🔐 LOGIN
export const loginApi = (data) => {
  return axiosClient.post("/auth/login", data);
};

// 📩 GỬI OTP
export const sendOtpApi = (email) => {
  return axiosClient.post("/auth/send-otp", { email });
};

// ✅ VERIFY OTP
export const verifyOtpApi = (data) => {
  return axiosClient.post("/auth/verify-otp", data);
};

// 📝 REGISTER
export const registerApi = (data) => {
  return axiosClient.post("/auth/register", data);
};

// 🔁 QUÊN MẬT KHẨU
export const forgotPasswordApi = (email) => {
  return axiosClient.post("/auth/forgot-password", { email });
};

// 🔄 RESET PASSWORD
export const resetPasswordApi = (data) => {
  return axiosClient.post("/auth/reset-password", data);
};
