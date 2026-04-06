import axiosClient from "../../../services/axiosClient";

export const getMeApi = () => {
  return axiosClient.get("/user/me");
};

export const uploadAvatarApi = (formData) => {
  return axiosClient.post("/user/upload-avatar", formData);
};

export const uploadCoverApi = (formData) => {
  return axiosClient.post("/user/upload-cover", formData);
};

export const updateUserApi = (data) => {
  return axiosClient.put("/user/update", data);
};
export const changePasswordApi = (data) => {
  return axiosClient.post("/user/change-password", data);
};