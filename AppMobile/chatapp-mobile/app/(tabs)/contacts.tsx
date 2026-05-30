import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import useDebounce from "../../src/features/contacts/hooks/useDebounce";
import {
  acceptFriendRequestApi,
  getFriendRequestsApi,
  getFriendsApi,
  getMeApi,
  rejectFriendRequestApi,
  searchUsersApi,
  sendFriendRequestApi,
} from "../../src/features/contacts/api/contactsApi";

export default function ContactsScreen() {
  const router = useRouter();

  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounce(keyword, 500);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [loadingFriends, setLoadingFriends] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [searching, setSearching] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | string | null>(null);

  const isSearching = debouncedKeyword.trim().length > 0;

  const normalizeData = (data: any) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.content)) return data.content;
    return [];
  };

  const getCurrentUserId = (me: any) => {
    return me?.id ?? me?.userId ?? me?.data?.id ?? me?.data?.userId ?? null;
  };

  const buildPrivateRoomId = (
    myId: number | string,
    otherId: number | string
  ) => {
    const a = Number(myId);
    const b = Number(otherId);

    if (Number.isNaN(a) || Number.isNaN(b)) {
      return `${myId}_${otherId}`;
    }

    return a < b ? `${a}_${b}` : `${b}_${a}`;
  };

  const loadMe = async () => {
    try {
      const data = await getMeApi();
      setCurrentUser(data);
    } catch (error) {
      console.log("loadMe error:", error);
    }
  };

  const loadFriends = async () => {
    try {
      setLoadingFriends(true);
      const data = await getFriendsApi();
      setFriends(normalizeData(data));
    } catch (error) {
      console.log("loadFriends error:", error);
      setFriends([]);
    } finally {
      setLoadingFriends(false);
    }
  };

  const loadRequests = async () => {
    try {
      setLoadingRequests(true);
      const data = await getFriendRequestsApi();
      setRequests(normalizeData(data));
    } catch (error) {
      console.log("loadRequests error:", error);
      setRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  const searchUsers = async (text: string) => {
    try {
      setSearching(true);
      const data = await searchUsersApi(text);
      console.log("searchUsersApi keyword:", text);
      console.log("searchUsersApi response:", JSON.stringify(data, null, 2));
      setSearchResults(normalizeData(data));
    } catch (error) {
      console.log("searchUsers error:", error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    loadMe();
    loadFriends();
    loadRequests();
  }, []);

  useEffect(() => {
    if (debouncedKeyword.trim()) {
      searchUsers(debouncedKeyword.trim());
    } else {
      setSearchResults([]);
    }
  }, [debouncedKeyword]);

  const handleAddFriend = async (user: any) => {
    const id = user?.id ?? user?.userId;
    if (!id) return;

    try {
      setActionLoadingId(id);
      await sendFriendRequestApi(id);
      Alert.alert("Thành công", "Đã gửi lời mời kết bạn");
      loadFriends();
      loadRequests();
      if (debouncedKeyword.trim()) {
        searchUsers(debouncedKeyword.trim());
      }
    } catch (error) {
      console.log("sendFriendRequest error:", error);
      Alert.alert("Lỗi", "Không gửi được lời mời kết bạn");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAccept = async (request: any) => {
  const requestId =
    request?.id ??
    request?.requestId ??
    request?.friendshipId ??
    request?.friendId;

  console.log("accept request item:", JSON.stringify(request, null, 2));
  console.log("accept requestId:", requestId);

  if (!requestId) {
    Alert.alert("Lỗi", "Không tìm thấy id của lời mời kết bạn");
    return;
  }

  try {
    setActionLoadingId(requestId);
    const res = await acceptFriendRequestApi(requestId);
    console.log("acceptFriendRequestApi response:", res);

    Alert.alert("Thành công", "Đã chấp nhận lời mời");

    await loadFriends();
    await loadRequests();
  } catch (error: any) {
    console.log("acceptFriendRequest error:", error);
    console.log("acceptFriendRequest response:", error?.response?.data);
    console.log("acceptFriendRequest status:", error?.response?.status);

    Alert.alert("Lỗi", "Không thể chấp nhận lời mời");
  } finally {
    setActionLoadingId(null);
  }
};

  const handleReject = async (request: any) => {
  const requestId =
    request?.id ??
    request?.requestId ??
    request?.friendshipId ??
    request?.friendId;

  console.log("reject request item:", JSON.stringify(request, null, 2));
  console.log("reject requestId:", requestId);

  if (!requestId) {
    Alert.alert("Lỗi", "Không tìm thấy id của lời mời kết bạn");
    return;
  }

  try {
    setActionLoadingId(requestId);
    const res = await rejectFriendRequestApi(requestId);
    console.log("rejectFriendRequestApi response:", res);

    Alert.alert("Thành công", "Đã từ chối lời mời");
    await loadRequests();
  } catch (error: any) {
    console.log("rejectFriendRequest error:", error);
    console.log("rejectFriendRequest response:", error?.response?.data);
    console.log("rejectFriendRequest status:", error?.response?.status);

    Alert.alert("Lỗi", "Không thể từ chối lời mời");
  } finally {
    setActionLoadingId(null);
  }
};

  const openChat = (user: any) => {
    const myId = getCurrentUserId(currentUser);
    const otherId = user?.userId ?? user?.id;

    if (!myId || !otherId) {
      Alert.alert("Lỗi", "Không xác định được user để mở chat");
      return;
    }

    const roomId = buildPrivateRoomId(myId, otherId);
    const username = user?.username || user?.name || "Chat";

    router.push({
      pathname: "/chat/[roomId]",
      params: {
        roomId,
        username,
        otherUserId: String(otherId),
      },
    });
  };

  const renderUserRow = (item: any, mode: "search" | "friend") => {
    const id = item?.id ?? item?.userId ?? item?.friendshipId;
    const username =
      item?.username || item?.name || item?.fullName || "Người dùng";
    const avatar =
      item?.avatar ||
      item?.avatarUrl ||
      item?.profilePicture ||
      "https://via.placeholder.com/100";
    const status = item?.status || "";

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.userCard}
        onPress={() => openChat(item)}
      >
        <Image source={{ uri: avatar }} style={styles.avatar} />

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{username}</Text>
          {!!status && <Text style={styles.userStatus}>{status}</Text>}
        </View>

        <View style={styles.userActions}>
          {mode === "search" && status !== "FRIEND" && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => handleAddFriend(item)}
              disabled={actionLoadingId === id}
            >
              {actionLoadingId === id ? (
                <ActivityIndicator size="small" color="#4F46E5" />
              ) : (
                <Text style={styles.addBtnText}>Kết bạn</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.chatBtn}
            onPress={() => openChat(item)}
          >
            <Text style={styles.chatBtnText}>Nhắn tin</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };
const renderRequestItem = ({ item }: { item: any }) => {
  const requestId =
    item?.id ??
    item?.requestId ??
    item?.friendshipId ??
    item?.friendId;

  const sender = item?.sender || item?.fromUser || item;

  return (
    <View style={styles.requestCard}>
      <Text style={styles.requestName}>
        {sender?.fullName || sender?.name || sender?.username || "Người dùng"}
      </Text>

      <Text style={styles.requestEmail}>
        {sender?.email || sender?.username || ""}
      </Text>

      <View style={styles.requestActions}>
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => handleAccept(item)}
          disabled={actionLoadingId === requestId}
        >
          <Text style={styles.acceptBtnText}>Chấp nhận</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={() => handleReject(item)}
          disabled={actionLoadingId === requestId}
        >
          <Text style={styles.rejectBtnText}>Từ chối</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.title}>Danh bạ</Text>
        <Text style={styles.subTitle}>Tìm kiếm, kết bạn và trò chuyện</Text>
      </View>

      <FlatList
        data={[{ key: "content" }]}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        renderItem={() => (
          <View style={styles.body}>
            <View style={styles.searchWrap}>
              <TextInput
                value={keyword}
                onChangeText={setKeyword}
                placeholder="Tìm theo username..."
                placeholderTextColor="#8E8E93"
                style={styles.searchInput}
              />
            </View>

            {isSearching && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Kết quả tìm kiếm</Text>
                {searching ? (
                  <ActivityIndicator size="large" color="#4F46E5" />
                ) : searchResults.length === 0 ? (
                  <Text style={styles.emptyText}>Không tìm thấy người dùng</Text>
                ) : (
                  <FlatList
                    data={searchResults}
                    keyExtractor={(item, index) =>
                      String(item?.id ?? item?.userId ?? index)
                    }
                    renderItem={({ item }) => renderUserRow(item, "search")}
                    scrollEnabled={false}
                  />
                )}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lời mời kết bạn</Text>
              {loadingRequests ? (
                <ActivityIndicator size="small" color="#4F46E5" />
              ) : requests.length === 0 ? (
                <Text style={styles.emptyText}>Không có lời mời nào</Text>
              ) : (
                <FlatList
                  data={requests}
                  keyExtractor={(item, index) =>
                    String(item?.id ?? item?.requestId ?? index)
                  }
                  renderItem={renderRequestItem}
                  scrollEnabled={false}
                />
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bạn bè</Text>
              {loadingFriends ? (
                <ActivityIndicator size="small" color="#4F46E5" />
              ) : friends.length === 0 ? (
                <Text style={styles.emptyText}>Bạn chưa có bạn bè nào</Text>
              ) : (
                <FlatList
                  data={friends}
                  keyExtractor={(item, index) =>
                    String(
                      item?.friendshipId ?? item?.id ?? item?.userId ?? index
                    )
                  }
                  renderItem={({ item }) => renderUserRow(item, "friend")}
                  scrollEnabled={false}
                />
              )}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FB" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "#fff",
  },
  title: { fontSize: 24, fontWeight: "700", color: "#111827" },
  subTitle: { marginTop: 4, fontSize: 13, color: "#6B7280" },
  body: { padding: 16, paddingBottom: 30 },
  section: { marginTop: 18 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  emptyText: { fontSize: 14, color: "#6B7280" },

  searchWrap: {
    backgroundColor: "#F2F3F5",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: "center",
  },
  searchInput: {
    fontSize: 15,
    color: "#111827",
  },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E5E7EB",
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  userStatus: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },
  userActions: {
    gap: 8,
  },
  addBtn: {
    borderWidth: 1,
    borderColor: "#4F46E5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 82,
  },
  addBtnText: {
    color: "#4F46E5",
    fontWeight: "600",
    fontSize: 13,
  },
  chatBtn: {
    backgroundColor: "#4F46E5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 82,
  },
  chatBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },

  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  requestName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  requestEmail: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },
  requestActions: {
    flexDirection: "row",
    marginTop: 12,
    gap: 10,
  },
  acceptBtn: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  acceptBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
  rejectBtn: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  rejectBtnText: {
    color: "#374151",
    fontWeight: "600",
  },
});