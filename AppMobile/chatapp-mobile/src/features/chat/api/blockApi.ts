import axiosClient from "../../../shared/api/axios";

export const blockUserApi = async (targetId: number | string) => {
  const res = await axiosClient.post(`/block/${targetId}`);
  return res.data;
};

export const unblockUserApi = async (targetId: number | string) => {
  const res = await axiosClient.delete(`/block/${targetId}`);
  return res.data;
};

export const checkBlockApi = async (targetId: number | string) => {
  const res = await axiosClient.get(`/block/check/${targetId}`);
  return res.data;
};