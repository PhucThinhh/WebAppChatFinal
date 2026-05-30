import React from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  item: any;
  mode?: "friend" | "search";
  loadingId?: string | number | null;
  onAddFriend?: (item: any) => void;
  onMessage?: (item: any) => void;
};

export default function ContactItem({
  item,
  mode = "search",
  loadingId,
  onAddFriend,
  onMessage,
}: Props) {
  const userId = item?.id ?? item?.userId;
  const fullName = item?.fullName || item?.name || item?.username || "Người dùng";
  const email = item?.email || "";
  const avatar =
    item?.avatarUrl ||
    item?.profilePicture ||
    item?.avatar ||
    "https://via.placeholder.com/100";

  return (
    <View style={styles.container}>
      <Image source={{ uri: avatar }} style={styles.avatar} />

      <View style={styles.info}>
        <Text style={styles.name}>{fullName}</Text>
        {!!email && <Text style={styles.email}>{email}</Text>}
      </View>

      <View style={styles.actions}>
        {mode === "search" && (
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => onAddFriend?.(item)}
            disabled={loadingId === userId}
          >
            {loadingId === userId ? (
              <ActivityIndicator size="small" color="#4F46E5" />
            ) : (
              <Text style={styles.addBtnText}>Kết bạn</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.chatBtn}
          onPress={() => onMessage?.(item)}
        >
          <Text style={styles.chatBtnText}>Nhắn tin</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  email: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
  },
  actions: {
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
});