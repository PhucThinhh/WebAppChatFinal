import React from "react";
import { Dimensions, FlatList, StyleSheet, Text, View } from "react-native";

const { width } = Dimensions.get("window");

export default function ChatBox({ messages, flatListRef }) {
  const renderItem = ({ item, index }) => {
    const isMe = item.sender === "me";

    return (
      <View
        style={[
          styles.messageContainer,
          isMe ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}
      >
        <View
          style={[styles.bubble, isMe ? styles.myBubble : styles.theirBubble]}
        >
          <Text
            style={[
              styles.messageText,
              isMe ? styles.myText : styles.theirText,
            ]}
          >
            {item.text}
          </Text>

          <Text
            style={[styles.timeText, isMe ? styles.myTime : styles.theirTime]}
          >
            {item.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      keyExtractor={(_, i) => i.toString()}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      // Tự động cuộn xuống khi data thay đổi
      onContentSizeChange={() =>
        flatListRef.current?.scrollToEnd({ animated: true })
      }
      onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      renderItem={renderItem}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 20,
  },
  messageContainer: {
    marginBottom: 8,
    flexDirection: "row",
    width: "100%",
  },
  myMessageContainer: {
    justifyContent: "flex-end",
  },
  theirMessageContainer: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: width * 0.75,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    // Đổ bóng nhẹ cho Android & iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  myBubble: {
    backgroundColor: "#007AFF", // Xanh chuẩn iOS
    borderBottomRightRadius: 4, // Bo góc sắc sảo ở phía người gửi
  },
  theirBubble: {
    backgroundColor: "#E9E9EB", // Xám nhạt hiện đại
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myText: {
    color: "#fff",
  },
  theirText: {
    color: "#000",
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: "400",
  },
  myTime: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "right",
  },
  theirTime: {
    color: "#8E8E93",
    textAlign: "left",
  },
});
