import { Feather, Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { getMeApi, updateUserApi } from "../src/features/user/api/userApi";

export default function EditProfile() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("MALE");

  // Quản lý DatePicker
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [initialUser, setInitialUser] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"success" | "error" | "">("");

  const validateAge = (selectedDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - selectedDate.getFullYear();

    const m = today.getMonth() - selectedDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < selectedDate.getDate())) {
      age--;
    }

    return age >= 13;
  };

  const fetchUser = async () => {
    try {
      const res = await getMeApi();
      const data = res.data;

      setInitialUser({
        username: data.username,
        gender: data.gender,
        birthday: data.birthday,
      });

      setUsername(data.username || "");
      setGender(data.gender || "MALE");
      if (data.birthday) {
        setDate(new Date(data.birthday));
      }
    } catch (err) {
      console.log("Lỗi lấy user:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios"); // iOS giữ Picker mở, Android đóng ngay
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSave = async () => {
    const formattedDate = date.toISOString().split("T")[0];

    if (!username.trim()) {
      setType("error");
      setMessage("Vui lòng nhập tên");
      return;
    }

    if (!validateAge(date)) {
      setType("error");
      setMessage("Bạn phải từ 13 tuổi trở lên");
      return;
    }

    if (
      username === initialUser.username &&
      gender === initialUser.gender &&
      formattedDate === initialUser.birthday
    ) {
      setType("error");
      setMessage("Không có thay đổi nào");
      return;
    }

    try {
      setSaving(true);

      await updateUserApi({
        username,
        birthday: formattedDate,
        gender,
      });

      setType("success");
      setMessage("Cập nhật thành công 🎉");

      setTimeout(() => {
        router.back();
      }, 1200);
    } catch (err: any) {
      setType("error");
      setMessage(err?.response?.data?.message || "Không thể cập nhật");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0099ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {message !== "" && (
        <View
          style={[
            styles.toast,
            type === "success" ? styles.toastSuccess : styles.toastError,
          ]}
        >
          <Text style={styles.toastText}>{message}</Text>
        </View>
      )}
      {/* Khóa StatusBar để không bị tràn nội dung lên trên */}
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0099ff"
        translucent={false}
      />

      {/* HEADER */}
      <SafeAreaView style={styles.headerSafeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chỉnh sửa thông tin</Text>
        </View>
      </SafeAreaView>

      <View style={styles.form}>
        {/* USERNAME */}
        <View style={styles.inputWrapper}>
          <TextInput
            value={username}
            onChangeText={setUsername}
            style={styles.input}
            placeholder="Tên"
          />
          <Feather name="edit-2" size={16} color="#999" />
        </View>

        {/* BIRTHDAY PICKER */}
        <TouchableOpacity
          style={styles.inputWrapper}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            {date.toLocaleDateString("vi-VN")}
          </Text>
          <Feather name="calendar" size={18} color="#999" />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onDateChange}
            maximumDate={
              new Date(new Date().setFullYear(new Date().getFullYear() - 13))
            } // Không cho chọn ngày tương lai
          />
        )}

        {/* GENDER */}
        <View style={styles.genderRow}>
          <TouchableOpacity
            style={styles.radioItem}
            onPress={() => setGender("MALE")}
          >
            <Ionicons
              name={gender === "MALE" ? "checkmark-circle" : "ellipse-outline"}
              size={22}
              color={gender === "MALE" ? "#0099ff" : "#ccc"}
            />
            <Text
              style={[
                styles.radioLabel,
                gender === "MALE" && styles.selectedText,
              ]}
            >
              Nam
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioItem}
            onPress={() => setGender("FEMALE")}
          >
            <Ionicons
              name={
                gender === "FEMALE" ? "checkmark-circle" : "ellipse-outline"
              }
              size={22}
              color={gender === "FEMALE" ? "#0099ff" : "#ccc"}
            />
            <Text
              style={[
                styles.radioLabel,
                gender === "FEMALE" && styles.selectedText,
              ]}
            >
              Nữ
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelText}>Hủy bỏ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveText}>Lưu thay đổi</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  headerSafeArea: { backgroundColor: "#0099ff" },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    marginLeft: 20,
    fontWeight: "600",
  },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  form: { padding: 25 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#eee",
    marginBottom: 25,
    paddingVertical: 8,
  },
  input: { flex: 1, fontSize: 16, color: "#333" },
  dateText: { flex: 1, fontSize: 16, color: "#333" },
  genderRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 10,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 50,
  },
  radioLabel: { marginLeft: 8, fontSize: 16, color: "#666" },
  selectedText: { color: "#0099ff", fontWeight: "500" },

  toast: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    padding: 14,
    borderRadius: 14,
    zIndex: 999,
    elevation: 10,
  },

  toastSuccess: {
    backgroundColor: "#dcfce7",
  },

  toastError: {
    backgroundColor: "#fee2e2",
  },

  toastText: {
    textAlign: "center",
    fontWeight: "600",
  },

  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 40,
    alignItems: "center",
  },

  saveBtn: {
    flex: 2, // Nút Lưu chiếm nhiều không gian hơn
    backgroundColor: "#0066FF", // Màu Blue đồng bộ
    height: 56,
    borderRadius: 28, // Bo tròn dạng viên thuốc 100% giống Register
    justifyContent: "center",
    alignItems: "center",
    // Đổ bóng (Shadow) cho nút Lưu
    shadowColor: "#0066FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },

  saveText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
  },

  cancelBtn: {
    flex: 1, // Nút Hủy nhỏ hơn
    height: 56,
    backgroundColor: "#F5F6F8", // Màu nền nhạt tinh tế
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },

  cancelText: {
    color: "#6b7280",
    fontWeight: "600",
    fontSize: 15,
  },
});
