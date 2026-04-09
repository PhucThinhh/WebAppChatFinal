import { Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ChatInput({ input, setInput, onSend }) {
  return (
    <View
      style={{
        flexDirection: "row",
        padding: 10,
        borderTopWidth: 1,
        borderColor: "#333",
      }}
    >
      <TextInput
        value={input}
        onChangeText={setInput}
        placeholder="Nhập tin nhắn..."
        placeholderTextColor="#aaa"
        style={{
          flex: 1,
          backgroundColor: "#2a2a2a",
          color: "#fff",
          borderRadius: 20,
          paddingHorizontal: 15,
          paddingVertical: 10,
        }}
      />

      <TouchableOpacity
        onPress={onSend}
        style={{
          marginLeft: 10,
          backgroundColor: "#005ae0",
          padding: 12,
          borderRadius: 20,
        }}
      >
        <Text style={{ color: "#fff" }}>Gửi</Text>
      </TouchableOpacity>
    </View>
  );
}
