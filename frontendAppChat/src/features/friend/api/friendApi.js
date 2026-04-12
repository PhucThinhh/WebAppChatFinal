import axiosClient from "../../../services/axiosClient";

// 📩 Lấy danh sách lời mời
export const getFriendRequestsApi = () => {
  return axiosClient.get("/friends/requests");
};

// 👥 Lấy danh sách bạn bè
export const getFriendsApi = () => {
  return axiosClient.get("/friends");
};

// 🔥 Gửi lời mời kết bạn
export const sendFriendRequestApi = (receiverId) => {
  return axiosClient.post("/friends/request", { receiverId });
};

// ✅ Chấp nhận
export const acceptFriendApi = (id) => {
  return axiosClient.post(`/friends/accept/${id}`);
};

// ❌ Từ chối
export const rejectFriendApi = (id) => {
  return axiosClient.post(`/friends/reject/${id}`);
};

export const searchUserApi = (keyword) => {
  return axiosClient.get(`/friends/search?keyword=${keyword}`);
};