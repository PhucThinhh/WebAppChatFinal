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
  return axiosClient.post("http://localhost:8080/api/chat/group/create", data);
};

export const getMyGroupsApi = (userId) => {
  return axiosClient.get(`/chat/group/my-groups?userId=${userId}`);
};

export const addMemberApi = (groupId, userId) => {
  return axiosClient.post(
    `/chat/group/add-member?groupId=${groupId}&userId=${userId}`
  );
};
/** Trả về mảng GroupMemberDTO: { userId, username, avatar, role } */
export const getGroupMembersApi = (groupId) => {
  return axiosClient.get(`/chat/group/members?groupId=${groupId}`);
};

export const removeMemberApi = (groupId, userId, currentUserId) => {
  return axiosClient.delete(
    `/chat/group/remove-member?groupId=${groupId}&userId=${userId}&currentUserId=${currentUserId}`
  );
};

export const deleteGroupApi = (groupId, currentUserId) => {
  return axiosClient.delete(
    `/chat/group/delete?groupId=${groupId}&currentUserId=${currentUserId}`
  );
};

export const updateRoleApi = (groupId, userId, role, currentUserId) => {
  return axiosClient.put(
    `/chat/group/update-role?groupId=${groupId}&userId=${userId}&role=${role}&currentUserId=${currentUserId}`
  );
};

export const leaveGroupApi = (groupId, userId) => {
  return axiosClient.delete(
    `/chat/group/leave?groupId=${groupId}&userId=${userId}`
  );
};