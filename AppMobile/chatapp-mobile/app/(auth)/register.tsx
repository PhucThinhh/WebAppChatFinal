import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { ChevronLeft, Eye, EyeOff, Sparkles } from "lucide-react-native";
import React, { useEffect, useState } from "react";

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
    registerApi,
    sendOtpApi,
    verifyOtpApi,
} from "../../src/features/auth/api/authApi";

export default function Register() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // STATE
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [birthday, setBirthday] = useState("");
  const [password, setPassword] = useState("");
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  

  const [errors, setErrors] = useState<any>({});
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (step !== 2) return; // chỉ chạy ở màn OTP

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  // ================= VALIDATE =================
  const validateEmail = (value: string) => {
    if (!value) return "Vui lòng nhập email";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Email không hợp lệ";
    return "";
  };

  const validatePhone = (value: string) => {
    if (!value) return "Vui lòng nhập SĐT";
    if (!/^(0|\+84)[0-9]{9}$/.test(value)) return "SĐT không hợp lệ";
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

  const validateAge = (selectedDate: Date) => {
    const today = new Date();

    let age = today.getFullYear() - selectedDate.getFullYear();

    const m = today.getMonth() - selectedDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < selectedDate.getDate())) {
      age--;
    }

    return age >= 13;
  };

  // ================= HANDLE CHANGE =================
  const handleChange = (field: string, value: string) => {
    let error = "";

    if (field === "email") error = validateEmail(value);
    if (field === "phone") error = validatePhone(value);
    if (field === "password") error = validatePassword(value);

    setErrors((prev: any) => ({ ...prev, [field]: error }));

    if (field === "email") setEmail(value);
    if (field === "otp") setOtp(value);
    if (field === "username") setUsername(value);
    if (field === "phone") setPhone(value);
    if (field === "gender") setGender(value);
    if (field === "birthday") setBirthday(value);
    if (field === "password") setPassword(value);
  };

  // ================= STEP 1 =================
  const handleSendOtp = async () => {
    const emailError = validateEmail(email);
    if (emailError) return setErrors({ email: emailError });

    setLoading(true);
    try {
      await sendOtpApi(email);
      setStep(2);
      setTimeLeft(300);
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
  const handleRegister = async () => {
    const newErrors: any = {
      username: !username ? "Vui lòng nhập tên" : "",
      phone: validatePhone(phone),
      password: validatePassword(password),
      gender: !gender ? "Vui lòng chọn giới tính" : "",
    };

    // 🔥 CHECK NGÀY SINH
    if (!birthday) {
      newErrors.birthday = "Vui lòng chọn ngày sinh";
    } else if (!validateAge(new Date(birthday))) {
      newErrors.birthday = "Bạn phải từ 13 tuổi trở lên";
    }

    setErrors(newErrors);

    if (Object.values(newErrors).some((e) => e)) return;

    setLoading(true);
    try {
      await registerApi({
        email,
        username,
        password,
        phone,
        gender,
        birthday,
      });

      router.replace("/login");
    } catch (err: any) {
      const message = err.response?.data || "Đăng ký thất bại";
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
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag" // 🔥 QUAN TRỌNG
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

        <Text style={styles.title}>Đăng ký tài khoản</Text>

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

            {/* ⏱ COUNTDOWN */}
            {timeLeft > 0 ? (
              <Text
                style={{ textAlign: "center", color: "#6b7280", marginTop: 8 }}
              >
                OTP hết hạn sau: {Math.floor(timeLeft / 60)}:
                {timeLeft % 60 < 10 ? "0" : ""}
                {timeLeft % 60}
              </Text>
            ) : (
              <Text
                style={{
                  textAlign: "center",
                  color: "#ef4444",
                  marginTop: 8,
                }}
                onPress={handleSendOtp}
              >
                OTP đã hết hạn. Gửi lại?
              </Text>
            )}

            <TouchableOpacity
              style={styles.btn}
              onPress={handleVerifyOtp}
              disabled={timeLeft <= 0}
            >
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
            <Text style={styles.stepTitle}>Hoàn tất hồ sơ</Text>
            <Text style={styles.stepSubtitle}>
              Nhập thông tin để tạo tài khoản
            </Text>

            {renderInput("username", username, "Tên của bạn")}
            {renderInput("phone", phone, "Số điện thoại")}

            {/* DATE PICKER */}
            <View>
              <TouchableOpacity
                style={[
                  styles.inputBox,
                  errors.birthday && { borderColor: "#dc2626" },
                ]}
                onPress={() => setShowPicker(true)}
              >
                <Text
                  style={[
                    styles.input,
                    { color: birthday ? "#1a1a1a" : "#9ca3af" },
                  ]}
                >
                  {birthday || "Chọn ngày sinh"}
                </Text>
              </TouchableOpacity>

              {errors.birthday && (
                <Text style={styles.errorText}>{errors.birthday}</Text>
              )}
            </View>

            {renderInput("password", password, "Mật khẩu", true)}

            <Text style={styles.genderLabel}>Giới tính</Text>

            <View style={styles.genderRow}>
              <TouchableOpacity
                style={[styles.genderBtn, gender === "MALE" && styles.active]}
                onPress={() => setGender("MALE")}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === "MALE" && styles.genderTextActive,
                  ]}
                >
                  Nam
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.genderBtn, gender === "FEMALE" && styles.active]}
                onPress={() => setGender("FEMALE")}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === "FEMALE" && styles.genderTextActive,
                  ]}
                >
                  Nữ
                </Text>
              </TouchableOpacity>
            </View>

            {errors.gender && (
              <Text style={styles.errorText}>{errors.gender}</Text>
            )}

            <TouchableOpacity style={styles.btn} onPress={handleRegister}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Hoàn tất đăng ký</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
      {showPicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          maximumDate={new Date()}
          onChange={(event, selectedDate) => {
            setShowPicker(false);

            if (selectedDate) {
              if (!validateAge(selectedDate)) {
                setErrors((prev: any) => ({
                  ...prev,
                  birthday: "Bạn phải từ 13 tuổi trở lên",
                }));
                return;
              }

              setErrors((prev: any) => ({ ...prev, birthday: "" }));

              setDate(selectedDate);
              const formatted = selectedDate.toISOString().split("T")[0];
              setBirthday(formatted);
            }
          }}
        />
      )}
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

  genderLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
    marginTop: 8,
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

  genderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16,
    gap: 12,
  },

  genderBtn: {
    flex: 0.48,
    padding: 14,
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },

  active: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },

  genderText: {
    color: "#6b7280",
    fontWeight: "600",
    fontSize: 15,
  },

  genderTextActive: {
    color: "#ffffff",
  },
});
