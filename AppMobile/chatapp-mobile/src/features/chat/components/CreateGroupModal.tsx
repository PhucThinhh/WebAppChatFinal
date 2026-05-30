import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { createGroupApi } from "../api/groupApi";

type Props = {
  visible: boolean;
  onClose: () => void;
  friends: any[];
};

export default function CreateGroupModal({ visible, onClose, friends }: Props) {
  const [groupName, setGroupName] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleSelect = (userId: number) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert("Lỗi", "Nhập tên nhóm");
      return;
    }

    if (selectedIds.length < 2) {
      Alert.alert("Lỗi", "Chọn ít nhất 2 thành viên");
      return;
    }

    try {
      setLoading(true);
      const res = await createGroupApi({
        name: groupName.trim(),
        memberIds: selectedIds,
      });

      console.log("createGroup response:", res);
      Alert.alert("Thành công", "Đã tạo nhóm");
      setGroupName("");
      setSelectedIds([]);
      onClose();
    } catch (error: any) {
      console.log("createGroup error:", error);
      console.log("createGroup response:", error?.response?.data);
      Alert.alert("Lỗi", "Không tạo được nhóm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Tạo nhóm</Text>

          <TextInput
            value={groupName}
            onChangeText={setGroupName}
            placeholder="Tên nhóm"
            style={styles.input}
          />

          <FlatList
            data={friends}
            keyExtractor={(item, index) =>
              String(item?.userId ?? item?.id ?? index)
            }
            style={{ maxHeight: 300 }}
            renderItem={({ item }) => {
              const userId = Number(item?.userId ?? item?.id);
              const checked = selectedIds.includes(userId);

              return (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => toggleSelect(userId)}
                >
                  <Text style={styles.rowText}>{item?.username}</Text>
                  <Text>{checked ? "✅" : "⬜"}</Text>
                </TouchableOpacity>
              );
            }}
          />

          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnGhost} onPress={onClose}>
              <Text>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleCreate}>
              <Text style={{ color: "#fff" }}>{loading ? "..." : "Tạo nhóm"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 16,
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    maxHeight: "80%",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#F2F3F5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  rowText: {
    fontSize: 15,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 8,
  },
  btnGhost: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  btnPrimary: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
});