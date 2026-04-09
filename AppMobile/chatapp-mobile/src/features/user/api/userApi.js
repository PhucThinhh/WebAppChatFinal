import axiosClient from "../../../shared/api/axios";

// GET USER
export const getMeApi = () => {
  return axiosClient.get("/user/me");
};

// UPLOAD AVATAR
export const uploadAvatarApi = (formData) => {
  return axiosClient.post("/user/upload-avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// UPLOAD COVER
export const uploadCoverApi = (formData) => {
  return axiosClient.post("/user/upload-cover", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// 🔥 THÊM CÁI QUAN TRỌNG NHẤT
export const updateUserApi = (data) => {
  return axiosClient.put("/user/update", data);
};

// (optional)
export const changePasswordApi = (data) => {
  return axiosClient.post("/user/change-password", data);
};
