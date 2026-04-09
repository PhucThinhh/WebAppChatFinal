import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const axiosClient = axios.create({
  baseURL: "http://10.0.2.2:8080/api",
});

// 👉 REQUEST: gắn token
axiosClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 👉 RESPONSE: xử lý lỗi
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem("token");

      // 👉 mobile không redirect ở đây
      console.log("Token hết hạn");
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
