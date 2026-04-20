import axiosClient from "../../../services/axiosClient";

// lấy tin nhắn
export const getMessagesApi = (roomId) => {
  return axiosClient.get(`/chat/messages/${roomId}`);
};

// xoá tin nhắn (1 chiều)
export const deleteMessageApi = (messageId) => {
  return axiosClient.delete(`/chat/message/${messageId}`);
};

// 🔥 THU HỒI TIN NHẮN (2 chiều)
export const recallMessageApi = (messageId) => {
  return axiosClient.put(`/chat/message/recall/${messageId}`);
};

export const deleteConversationApi = (roomId) => {
  return axiosClient.delete(`/chat/conversation/${roomId}`);
};

export const uploadFileApi = (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return axiosClient.post("/file/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// 🔥 block user
export const blockUserApi = (targetId) => {
  return axiosClient.post(`/block/${targetId}`);
};

// 🔥 unblock
export const unblockUserApi = (targetId) => {
  return axiosClient.delete(`/block/${targetId}`);
};

// 🔥 check block
export const checkBlockApi = (targetId) => {
  return axiosClient.get(`/block/check/${targetId}`);
};

export const getBlockStatusApi = (targetId) => {
  return axiosClient.get(`/block/status/${targetId}`);
};

export const createGroupApi = (data) => {
  return axiosClient.post("http://localhost:8080/chat/group/create", data);
};