import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { getFriendsApi, getMeApi } from "../../src/features/contacts/api/contactsApi";
import { getCurrentUserId } from "../../src/features/chat/utils/chatHelpers";
import CreateGroupModal from "../../src/features/chat/components/CreateGroupModal";

export default function ChatScreen() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const normalizeData = (data: any) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.content)) return data.content;
    if (data && typeof data === "object") {
      if ("friendshipId" in data || "userId" in data || "username" in data) {
        return [data];
      }
    }
    return [];
  };

  const buildPrivateRoomId = (myId: number | string, otherId: number | string) => {
    const a = Number(myId);
    const b = Number(otherId);
    return a < b ? `${a}_${b}` : `${b}_${a}`;
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [meRes, friendsRes] = await Promise.all([
        getMeApi(),
        getFriendsApi(),
      ]);

      setCurrentUser(meRes);
      setFriends(normalizeData(friendsRes));
    } catch (error) {
      console.log("load chat list error:", error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const openChat = (friend: any) => {
    const myId = getCurrentUserId(currentUser);
    const otherId = friend?.userId ?? friend?.id;

    if (!myId || !otherId) return;

    const roomId = buildPrivateRoomId(myId, otherId);
    const username = encodeURIComponent(friend?.username || friend?.name || "Chat");

    router.push(`/chat/${roomId}?username=${username}`);
  };

  const renderFriendItem = ({ item }: { item: any }) => {
    const username = item?.username || item?.name || "Người dùng";
    const avatar =
      item?.avatar ||
      item?.avatarUrl ||
      item?.profilePicture ||
      "https://via.placeholder.com/100";
    const status = item?.status || "";

    return (
      <TouchableOpacity
        style={styles.itemContainer}
        activeOpacity={0.85}
        onPress={() => openChat(item)}
        disabled={!currentUser}
      >
        <Image source={{ uri: avatar }} style={styles.avatar} />

        <View style={styles.info}>
          <Text style={styles.name}>{username}</Text>
          <Text style={styles.lastMessage}>{status || "Chat ngay"}</Text>
        </View>

        <Text style={styles.timeText}>Chat</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1296F3" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Tin nhắn</Text>
          <Text style={styles.headerSub}>Bạn bè và nhóm chat</Text>
        </View>

        <TouchableOpacity
          style={styles.groupBtn}
          activeOpacity={0.85}
          onPress={() => {
            console.log("clicked + Nhóm");
            setShowCreateGroup(true);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.groupBtnText}>+ Nhóm</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : friends.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>Chưa có bạn bè để nhắn tin</Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item, index) =>
            String(item?.friendshipId ?? item?.userId ?? item?.id ?? index)
          }
          renderItem={renderFriendItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      <CreateGroupModal
        visible={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        friends={friends}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    backgroundColor: "#1296F3",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 84,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  headerSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    marginTop: 2,
  },
  groupBtn: {
    backgroundColor: "#FFFFFF",
    minWidth: 86,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  groupBtnText: {
    color: "#1296F3",
    fontWeight: "700",
    fontSize: 14,
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#6B7280",
    fontSize: 15,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F1F1",
    backgroundColor: "#fff",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E5E7EB",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  lastMessage: {
    marginTop: 4,
    fontSize: 14,
    color: "#6B7280",
  },
  timeText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
});