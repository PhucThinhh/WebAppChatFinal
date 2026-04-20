import React from "react";
import {
  Alert,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { recallMessageApi } from "../api/chatApi";
import { formatTime, isImageFile } from "../utils/chatHelpers";

type Props = {
  item: any;
  isMine: boolean;
  onRecalled?: () => void;
};

export default function MessageBubble({ item, isMine, onRecalled }: Props) {
  const content = item?.content || "";
  const createdAt = item?.createdAt || "";
  const fileUrl = item?.fileUrl || "";
  const type = item?.type || "TEXT";
  const isFile = type === "FILE" || !!fileUrl;
  const imageFile = isFile && fileUrl && isImageFile(fileUrl);
  const isRecalled = !!item?.isRecalled;

  const handleLongPress = () => {
    if (!isMine || !item?.id) return;

    Alert.alert("Tin nhắn", "Bạn muốn thu hồi tin nhắn này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Thu hồi",
        style: "destructive",
        onPress: async () => {
          try {
            await recallMessageApi(item.id);
            onRecalled?.();
          } catch (error: any) {
            console.log("recallMessage error:", error);
            console.log("recallMessage response:", error?.response?.data);
            Alert.alert("Lỗi", "Không thể thu hồi tin nhắn");
          }
        },
      },
    ]);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onLongPress={handleLongPress}
      disabled={!isMine}
      style={[
        styles.messageBubble,
        isMine ? styles.myBubble : styles.otherBubble,
      ]}
    >
      {isRecalled ? (
        <Text style={styles.recalledText}>Tin nhắn đã được thu hồi</Text>
      ) : imageFile ? (
        <TouchableOpacity onPress={() => Linking.openURL(fileUrl)}>
          <Image source={{ uri: fileUrl }} style={styles.imageMessage} />
        </TouchableOpacity>
      ) : isFile ? (
        <TouchableOpacity
          style={styles.fileBox}
          onPress={() => fileUrl && Linking.openURL(fileUrl)}
        >
          <Text style={styles.fileText}>{content || "Tệp đính kèm"}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.messageText}>{content}</Text>
      )}

      <Text style={styles.timeText}>{formatTime(createdAt)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    marginBottom: 8,
    maxWidth: "78%",
  },
  otherBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 6,
  },
  myBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#D9F0FF",
    borderTopRightRadius: 6,
  },
  messageText: {
    color: "#111827",
    fontSize: 15,
    lineHeight: 20,
  },
  recalledText: {
    color: "#6B7280",
    fontSize: 14,
    fontStyle: "italic",
  },
  timeText: {
    marginTop: 4,
    fontSize: 11,
    color: "#7C8798",
    alignSelf: "flex-end",
  },
  imageMessage: {
    width: 180,
    height: 180,
    borderRadius: 12,
    backgroundColor: "#DDD",
  },
  fileBox: {
    paddingVertical: 4,
  },
  fileText: {
    color: "#2563EB",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});