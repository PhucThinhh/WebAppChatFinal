import axiosClient from "../../../shared/api/axios";

export const createGroupApi = async (payload: {
  name: string;
  memberIds: number[];
}) => {
  const res = await axiosClient.post("/chat/group/create", payload);
  return res.data;
};