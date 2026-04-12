// api/chatApi.js
import axiosClient from "../../../services/axiosClient";

export const getMessagesApi = (roomId) => {
  return axiosClient.get(`/chat/messages/${roomId}`);
};