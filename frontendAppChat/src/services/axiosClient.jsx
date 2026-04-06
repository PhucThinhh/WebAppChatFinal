import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:8080/api",
});

// 👉 REQUEST: gắn token (theo từng tab)
axiosClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 👉 RESPONSE: xử lý lỗi
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // ❌ chỉ logout tab hiện tại
      sessionStorage.clear();

      // redirect về login
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
