import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Props = {
  text: string;
  setText: (v: string) => void;
  uploading: boolean;
  onPickImage: () => void;
  onPickFile: () => void;
  onSend: () => void;
  disabled?: boolean;
  /** Bật: gửi tin tự thêm `/ai` (backend ChatService) */
  aiMode?: boolean;
  onToggleAiMode?: () => void;
};

export default function ChatInputBar({
  text,
  setText,
  uploading,
  onPickImage,
  onPickFile,
  onSend,
  disabled,
  aiMode,
  onToggleAiMode,
}: Props) {
  return (
    <View style={styles.inputWrap}>
      <TouchableOpacity style={styles.iconBtn} onPress={onPickImage} disabled={disabled || uploading}>
        <Text style={styles.iconText}>🖼️</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconBtn} onPress={onPickFile} disabled={disabled || uploading}>
        <Text style={styles.iconText}>📎</Text>
      </TouchableOpacity>

      {onToggleAiMode != null && (
        <TouchableOpacity
          style={[styles.iconBtn, aiMode && styles.aiBtnActive]}
          onPress={onToggleAiMode}
          disabled={disabled || uploading}
        >
          <Text style={styles.iconText}>✨</Text>
        </TouchableOpacity>
      )}

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={
          disabled
            ? "Bạn đang chặn người này"
            : aiMode
              ? "Câu hỏi cho AI (gửi sẽ thêm /ai)..."
              : "Nhắn tin..."
        }
        placeholderTextColor="#8E8E93"
        style={styles.input}
        editable={!disabled && !uploading}
      />

      <TouchableOpacity
        style={[styles.sendBtn, (uploading || disabled) && styles.sendBtnDisabled]}
        onPress={onSend}
        disabled={uploading || disabled}
      >
        <Text style={styles.sendText}>{uploading ? "..." : "Gửi"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  iconText: {
    fontSize: 18,
  },
  aiBtnActive: {
    backgroundColor: "#059669",
  },
  input: {
    flex: 1,
    backgroundColor: "#F2F3F5",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#111827",
    fontSize: 15,
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
  },
  sendBtnDisabled: {
    opacity: 0.6,
  },
  sendText: {
    color: "#fff",
    fontWeight: "600",
  },
});
