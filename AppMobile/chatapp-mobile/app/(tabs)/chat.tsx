import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import ChatItem from "../../src/features/chat/components/ChatItem";

export default function ChatScreen() {
  const chatData = [
    {
      id: "1",
      name: "My Documents",
      lastMessage: "Bạn: <% tickets.forEach...",
      time: "T3",
      unread: 0,
      avatar: "https://via.placeholder.com/150",
    },
    {
      id: "2",
      name: "Circle K Vietnam Careers",
      lastMessage: "😉 TÌM VIỆC KHÔNG KHÓ...",
      time: "1 giờ",
      unread: 0,
      avatar: "https://via.placeholder.com/150",
    },
    {
      id: "3",
      name: "Gia Đình Họ Võ",
      lastMessage: "Di Sau: [Link] 1.4 triệu lượt xem...",
      time: "6 giờ",
      unread: 1,
      avatar: "https://via.placeholder.com/150",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#00a3ff" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <Ionicons name="search" size={22} color="#fff" />

        <TextInput
          placeholder="Tìm kiếm"
          placeholderTextColor="rgba(255,255,255,0.7)"
          style={styles.searchInput}
        />

        <Ionicons
          name="qr-code-outline"
          size={22}
          color="#fff"
          style={{ marginRight: 15 }}
        />
        <Ionicons name="add" size={28} color="#fff" />
      </View>

      {/* LIST */}
      <FlatList
        data={chatData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ChatItem item={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    backgroundColor: "#00a3ff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    height: 55, // Thống nhất độ cao
    paddingTop: StatusBar.currentHeight ? 0 : 0, // Tránh lệch trên các thiết bị khác nhau
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    marginLeft: 15, // Khoảng cách đều từ icon search đến chữ
    height: "100%", // Để vùng chạm tìm kiếm rộng hơn
  },

  separator: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginLeft: 85,
  },
});
