import { useRouter } from "expo-router";
import { ChevronLeft, Eye, EyeOff, Sparkles } from "lucide-react-native";
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
import {
    resetPasswordApi,
    sendOtpApi,
    verifyOtpApi,
} from "../../src/features/auth/api/authApi";

export default function ForgotPassword() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // STATE
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState("");

  const [errors, setErrors] = useState<any>({});

  // ================= VALIDATE =================
  const validateEmail = (value: string) => {
    if (!value) return "Vui lòng nhập email";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Email không hợp lệ";
    return "";
  };

 const validatePassword = (value: string) => {
   if (!value) return "Vui lòng nhập mật khẩu";
   if (value.length < 6) return "Ít nhất 6 ký tự";
   if (!/(?=.*[A-Z])/.test(value)) return "Phải có chữ hoa";
   if (!/(?=.*\d)/.test(value)) return "Phải có số";
   if (!/(?=.*[@$!%*?&])/.test(value)) return "Phải có ký tự đặc biệt";
   return "";
 };

  // ================= HANDLE CHANGE =================
  const handleChange = (field: string, value: string) => {
    let error = "";

    if (field === "email") error = validateEmail(value);
    if (field === "password") error = validatePassword(value);
    if (field === "confirmPassword" && value !== password)
      error = "Mật khẩu không khớp";

    setErrors((prev: any) => ({ ...prev, [field]: error }));

    if (field === "email") setEmail(value);
    if (field === "otp") setOtp(value);
    if (field === "password") setPassword(value);
    if (field === "confirmPassword") setConfirmPassword(value);
  };

  // ================= STEP 1 =================
  const handleSendOtp = async () => {
    const emailError = validateEmail(email);
    if (emailError) return setErrors({ email: emailError });

    setLoading(true);
    try {
      await sendOtpApi(email);
      setStep(2);
      setErrors({});
    } catch {
      setErrors({ email: "Gửi OTP thất bại" });
    } finally {
      setLoading(false);
    }
  };

  // ================= STEP 2 =================
  const handleVerifyOtp = async () => {
    if (!otp) return setErrors({ otp: "Vui lòng nhập OTP" });

    setLoading(true);
    try {
      await verifyOtpApi({ email, otp });
      setStep(3);
      setErrors({});
    } catch {
      setErrors({ otp: "OTP không đúng" });
    } finally {
      setLoading(false);
    }
  };

  // ================= STEP 3 =================
  const handleResetPassword = async () => {
    const passwordError = validatePassword(password);
    const confirmError =
      confirmPassword !== password ? "Mật khẩu không khớp" : "";

    setErrors({
      password: passwordError,
      confirmPassword: confirmError,
    });

    if (passwordError || confirmError) return;

    setLoading(true);

    try {
      await resetPasswordApi({
        email,
        otp,
        newPassword: password,
      });

      // ✅ hiển thị success
      setSuccess("Đổi mật khẩu thành công 🎉");

      // 🔥 delay rồi chuyển trang
      setTimeout(() => {
        router.replace("/login");
      }, 1200);
    } catch (err: any) {
      const message = err.response?.data || "Đặt lại mật khẩu thất bại";
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  };

  // ================= UI INPUT =================
  const renderInput = (
    field: string,
    value: string,
    placeholder: string,
    secure = false
  ) => (
    <View>
      <View
        style={[styles.inputBox, errors[field] && { borderColor: "#dc2626" }]}
      >
        <TextInput
          value={value}
          onChangeText={(text) => handleChange(field, text)}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          style={styles.input}
          secureTextEntry={secure && !showPassword}
        />

        {secure && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            {showPassword ? (
              <EyeOff size={20} color="#6b7280" />
            ) : (
              <Eye size={20} color="#6b7280" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {errors[field] ? (
        <Text style={styles.errorText}>{errors[field]}</Text>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={20}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {step > 1 && (
          <TouchableOpacity
            onPress={() => setStep(step - 1)}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color="#4f46e5" />
          </TouchableOpacity>
        )}

        <View style={styles.logo}>
          <Sparkles size={32} color="#4f46e5" />
        </View>

        <Text style={styles.title}>Quên mật khẩu</Text>

        <View style={styles.stepIndicator}>
          <View style={[styles.step, step >= 1 && styles.stepActive]} />
          <View style={[styles.step, step >= 2 && styles.stepActive]} />
          <View style={[styles.step, step >= 3 && styles.stepActive]} />
        </View>

        {/* ERROR GENERAL */}
        {errors.general && (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>{errors.general}</Text>
          </View>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <Text style={styles.stepTitle}>Xác nhận email của bạn</Text>
            <Text style={styles.stepSubtitle}>
              Nhập email liên kết với tài khoản của bạn
            </Text>
            {renderInput("email", email, "Nhập email")}
            <TouchableOpacity style={styles.btn} onPress={handleSendOtp}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Gửi OTP</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <Text style={styles.stepTitle}>Nhập mã OTP</Text>
            <Text style={styles.stepSubtitle}>
              Chúng tôi đã gửi mã OTP đến {email}
            </Text>
            {renderInput("otp", otp, "000000")}
            <TouchableOpacity style={styles.btn} onPress={handleVerifyOtp}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Xác nhận OTP</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <Text style={styles.stepTitle}>Tạo mật khẩu mới</Text>
            <Text style={styles.stepSubtitle}>
              Nhập mật khẩu mới cho tài khoản của bạn
            </Text>

            {renderInput("password", password, "Mật khẩu mới", true)}
            {renderInput(
              "confirmPassword",
              confirmPassword,
              "Xác nhận mật khẩu",
              true
            )}

            <TouchableOpacity style={styles.btn} onPress={handleResetPassword}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Đặt lại mật khẩu</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
      {success ? (
        <View
          style={[
            styles.errorBox,
            {
              backgroundColor: "#dcfce7",
              borderLeftColor: "#16a34a",
            },
          ]}
        >
          <Text style={{ color: "#166534", fontWeight: "500" }}>{success}</Text>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 100,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  logo: {
    alignItems: "center",
    marginBottom: 28,
    backgroundColor: "#f0f4ff",
    paddingVertical: 16,
    borderRadius: 20,
    marginHorizontal: 40,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },

  stepIndicator: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginBottom: 32,
  },

  step: {
    height: 4,
    width: 28,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
  },

  stepActive: {
    backgroundColor: "#4f46e5",
  },

  stepTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
    textAlign: "center",
  },

  stepSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 20,
  },

  inputBox: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },

  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1a1a1a",
  },

  errorText: {
    color: "#dc2626",
    marginBottom: 12,
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 2,
  },

  errorBox: {
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#dc2626",
  },

  errorBoxText: {
    color: "#b91c1c",
    fontSize: 14,
    fontWeight: "500",
  },

  btn: {
    backgroundColor: "#4f46e5",
    padding: 16,
    borderRadius: 28,
    alignItems: "center",
    marginTop: 24,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },

  btnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
  },
});
