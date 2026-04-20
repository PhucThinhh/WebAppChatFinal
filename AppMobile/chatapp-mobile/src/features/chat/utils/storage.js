import AsyncStorage from "@react-native-async-storage/async-storage";

export const setToken = (token) => AsyncStorage.setItem("token", token);

export const getToken = () => AsyncStorage.getItem("token");

export const clearStorage = () => AsyncStorage.clear();
