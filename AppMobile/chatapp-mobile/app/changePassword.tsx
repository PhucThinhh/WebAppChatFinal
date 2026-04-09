import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { changePasswordApi } from "../src/features/user/api/userApi";

export default function ChangePassword() {
  const router = useRouter();

  // STATE
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [success, setSuccess] = useState("");

  // ================= VALIDATE =================
  const validatePassword = (value: string) => {
    if (!value) return "Vui lòng nhập mật khẩu";
    if (value.length < 6) return "Ít nhất 6 ký tự";
    if (!/(?=.*[A-Z])/.test(value)) return "Phải có ít nhất 1 chữ hoa";
    if (!/(?=.*\d)/.test(value)) return "Phải có ít nhất 1 chữ số";
    if (!/(?=.*[@$!%*?&])/.test(value)) return "Phải có ký tự đặc biệt";
    return "";
  };

  // ================= REALTIME VALIDATE =================
  const validateField = (field: string, value: string) => {
    let error = "";

    if (field === "old" && !value) error = "Vui lòng nhập mật khẩu cũ";

    if (field === "new") {
      error = validatePassword(value);
    }

    if (field === "confirm") {
      if (value !== newPassword) error = "Mật khẩu xác nhận không khớp";
    }

    setErrors((prev: any) => ({ ...prev, [field]: error }));
  };

  // ================= HANDLE SUBMIT =================
  const handleChangePassword = async () => {
    const newErrors: any = {};

    if (!oldPassword) newErrors.old = "Vui lòng nhập mật khẩu cũ";

    const passwordError = validatePassword(newPassword);
    if (passwordError) newErrors.new = passwordError;

    if (newPassword !== confirmPassword)
      newErrors.confirm = "Mật khẩu xác nhận không khớp";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      await changePasswordApi({ oldPassword, newPassword });

      // ✅ hiển thị success
      setSuccess("Đổi mật khẩu thành công 🎉");

      // ✅ logout + redirect
      setTimeout(async () => {
        await AsyncStorage.removeItem("token");
        router.replace("/login");
      }, 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Mật khẩu cũ không chính xác";

      if (msg.toLowerCase().includes("cũ")) {
        setErrors({ old: msg });
      } else {
        setErrors({ general: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  // ================= UI INPUT =================
  const renderPasswordInput = (
    label: string,
    value: string,
    setValue: (v: string) => void,
    show: boolean,
    setShow: (v: boolean) => void,
    errorKey: string,
    placeholder: string
  ) => (
    <View style={styles.inputWrapper}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.inputBox, errors[errorKey] && styles.inputBoxError]}>
        <TextInput
          value={value}
          onChangeText={(text) => {
            setValue(text);
            validateField(errorKey, text);
          }}
          placeholder={placeholder}
          placeholderTextColor="#A1A1A1"
          style={styles.input}
          secureTextEntry={!show}
        />

        <View style={styles.inputIcons}>
          {errorKey === "confirm" &&
            newPassword === confirmPassword &&
            confirmPassword !== "" && (
              <CheckCircle2 size={18} color="#10B981" />
            )}

          <TouchableOpacity onPress={() => setShow(!show)}>
            {show ? (
              <EyeOff size={22} color="#666" />
            ) : (
              <Eye size={22} color="#666" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {errors[errorKey] && (
        <Text style={styles.errorText}>{errors[errorKey]}</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Lock size={32} color="#4f46e5" />
          </View>
          <Text style={styles.title}>Đổi mật khẩu</Text>
          <Text style={styles.subtitle}>
            Cập nhật bảo mật cho tài khoản của bạn
          </Text>
        </View>

        {/* SUCCESS */}
        {success && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        )}

        {/* ERROR */}
        {errors.general && (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>{errors.general}</Text>
          </View>
        )}

        <View style={styles.form}>
          {renderPasswordInput(
            "MẬT KHẨU CŨ",
            oldPassword,
            setOldPassword,
            showOld,
            setShowOld,
            "old",
            "••••••••"
          )}

          {renderPasswordInput(
            "MẬT KHẨU MỚI",
            newPassword,
            setNewPassword,
            showNew,
            setShowNew,
            "new",
            "Tối thiểu 6 ký tự"
          )}

          {renderPasswordInput(
            "XÁC NHẬN MẬT KHẨU",
            confirmPassword,
            setConfirmPassword,
            showConfirm,
            setShowConfirm,
            "confirm",
            "Nhập lại mật khẩu"
          )}

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.7 }]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Xác nhận thay đổi</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingBottom: 40 },

  backButton: {
    marginTop: 50,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  header: { alignItems: "center", marginBottom: 30 },

  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#f0f4ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  title: { fontSize: 26, fontWeight: "bold", color: "#1a1a1a" },

  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 4,
  },

  inputWrapper: { marginBottom: 20 },

  label: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9ca3af",
    marginBottom: 8,
  },

  inputBox: {
    height: 56,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  inputBoxError: { borderColor: "#dc2626" },

  input: { flex: 1, fontSize: 16 },

  inputIcons: { flexDirection: "row", alignItems: "center", gap: 10 },

  errorText: {
    color: "#dc2626",
    fontSize: 12,
    marginTop: 6,
  },

  errorBox: {
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },

  errorBoxText: { color: "#b91c1c" },

  successBox: {
    backgroundColor: "#dcfce7",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },

  successText: {
    color: "#166534",
    fontWeight: "600",
  },

  btn: {
    height: 56,
    backgroundColor: "#4f46e5",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  form: {
    marginTop: 10,
  },

  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
