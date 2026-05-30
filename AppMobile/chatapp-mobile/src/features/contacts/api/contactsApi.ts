import axiosClient from "../../../shared/api/axios";

export const getFriendsApi = async () => {
  const res = await axiosClient.get("/friends");
  return res.data;
};

export const searchUsersApi = async (keyword: string) => {
  const res = await axiosClient.get("/friends/search", {
    params: { keyword },
  });
  return res.data;
};

export const getFriendRequestsApi = async () => {
  const res = await axiosClient.get("/friends/requests");
  return res.data;
};

export const sendFriendRequestApi = async (receiverId: number | string) => {
  const res = await axiosClient.post("/friends/request", {
    receiverId,
  });
  return res.data;
};

export const acceptFriendRequestApi = async (requestId: number | string) => {
  const res = await axiosClient.post(`/friends/accept/${requestId}`);
  return res.data;
};

export const rejectFriendRequestApi = async (requestId: number | string) => {
  const res = await axiosClient.post(`/friends/reject/${requestId}`);
  return res.data;
};

export const getMeApi = async () => {
  const res = await axiosClient.get("/user/me");
  return res.data;
};
