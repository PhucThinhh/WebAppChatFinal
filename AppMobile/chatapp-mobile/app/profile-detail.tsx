import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import {
  getMeApi,
  uploadAvatarApi,
  uploadCoverApi,
} from "../src/features/user/api/userApi";

type User = {
  username?: string;
  avatar?: string;
  coverImage?: string;
};

const { width } = Dimensions.get("window");
const STATUSBAR_HEIGHT =
  StatusBar.currentHeight ?? (Platform.OS === "ios" ? 44 : 0);

export default function ProfileDetail() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedCover, setSelectedCover] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  
const [message, setMessage] = useState("");
const [type, setType] = useState<"success" | "error" | "">("");

  const fetchUser = async () => {
    try {
      const res = await getMeApi();
      const data = res.data;
      setUser(data);
      setAvatar(data.avatar);
      setCover(data.coverImage);
    } catch (err) {
      console.log("Lỗi lấy user:", err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setType("");
      }, 2000); // 2 giây

      return () => clearTimeout(timer);
    }
  }, [message]);

  const pickImage = async (type: "avatar" | "cover") => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setType("error");
      setMessage("Cần quyền truy cập ảnh");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: type === "avatar" ? [1, 1] : [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      if (type === "avatar") setSelectedImage(result.assets[0].uri);
      else setSelectedCover(result.assets[0].uri);
    }
  };

  const handleUpload = async (uri: string, type: "avatar" | "cover") => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", {
        uri,
        name: `${type}.jpg`,
        type: "image/jpeg",
      } as any);

      const res =
        type === "avatar"
          ? await uploadAvatarApi(formData)
          : await uploadCoverApi(formData);

      if (res.data) {
        if (type === "avatar") setAvatar(res.data);
        else setCover(res.data);
      }
      fetchUser();
      setSelectedImage(null);
      setSelectedCover(null);
      setType("success");
      setMessage(`Đã cập nhật ${type === "avatar" ? "avatar" : "ảnh bìa"} 🎉`);
    } catch (err: any) {
      setType("error");
      setMessage(err?.response?.data?.message || "Không thể tải ảnh lên");
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#007fff" />
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
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* SECTION 1: COVER & HEADER BUTTONS */}
        <View style={styles.coverSection}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => pickImage("cover")}
          >
            <Image
              source={{
                uri:
                  cover ||
                  "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
              }}
              style={styles.coverImage}
            />
          </TouchableOpacity>

          {/* Nút quay lại và Menu */}
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.iconCircle}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity style={styles.iconCircle}>
                <Ionicons name="time-outline" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconCircle, { marginLeft: 15 }]}>
                <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SECTION 2: AVATAR & INFO */}
        <View style={styles.profileInfoSection}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={() => pickImage("avatar")}>
              <Image
                source={{
                  uri:
                    avatar || "https://randomuser.me/api/portraits/men/32.jpg",
                }}
                style={styles.avatarImg}
              />
            </TouchableOpacity>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Trạng thái hiện tại</Text>
              <View style={styles.statusArrow} />
            </View>
          </View>

          <Text style={styles.userNameText}>{user.username}</Text>

          <TouchableOpacity
            style={styles.editBioBtn}
            onPress={() => router.push("/profileInfo")}
          >
            <Feather name="edit-2" size={16} color="#00a3ff" />
            <Text style={styles.editBioText}>Cập nhật giới thiệu bản thân</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION 3: QUICK ACTIONS */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIconBg}>
              <MaterialCommunityIcons
                name="face-recognition"
                size={22}
                color="#00a3ff"
              />
            </View>
            <Text style={styles.actionText}>Cài zStyle</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIconBg}>
              <Ionicons name="images" size={20} color="#00a3ff" />
            </View>
            <Text style={styles.actionText}>Ảnh của tôi</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIconBg}>
              <MaterialCommunityIcons
                name="briefcase-variant"
                size={20}
                color="#00a3ff"
              />
            </View>
            <Text style={styles.actionText}>Kho khoảnh khắc</Text>
          </TouchableOpacity>
        </View>

        {/* SECTION 4: EMPTY LOG */}
        <View style={styles.emptyDiarySection}>
          <View style={styles.diaryIllustration}>
            <Image
              source={{
                uri: "https://cdn-icons-png.flaticon.com/512/3514/3514491.png",
              }}
              style={styles.diaryImg}
            />
            <View style={styles.heartIcon}>
              <Ionicons name="heart" size={16} color="#ff4d4d" />
            </View>
            <View style={styles.msgIcon}>
              <Ionicons name="chatbubble" size={16} color="#4cd964" />
            </View>
          </View>
          <Text style={styles.diaryTitle}>
            Hôm nay {user.username} có gì vui?
          </Text>
          <Text style={styles.diarySub}>
            Đây là Nhật ký của bạn - Hãy làm đầy Nhật ký với những dấu ấn cuộc
            đời và kỷ niệm đáng nhớ nhé!
          </Text>
          <TouchableOpacity style={styles.postBtn}>
            <Text style={styles.postBtnText}>Đăng lên Nhật ký</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL XÁC NHẬN (Dùng chung cho cả 2 loại ảnh) */}
      {(selectedImage || selectedCover) && (
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>
              Cập nhật {selectedImage ? "avatar" : "ảnh bìa"}?
            </Text>
            <Image
              source={{ uri: (selectedImage || selectedCover) as string }}
              style={selectedImage ? styles.previewAvatar : styles.previewCover}
            />
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => {
                  setSelectedImage(null);
                  setSelectedCover(null);
                }}
              >
                <Text style={{ fontWeight: "600" }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnSave}
                onPress={() =>
                  handleUpload(
                    (selectedImage || selectedCover)!,
                    selectedImage ? "avatar" : "cover"
                  )
                }
              >
                {isUploading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Lưu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Cover
  coverSection: { height: 260, width: "100%" },
  coverImage: { width: "100%", height: "100%", backgroundColor: "#eee" },
  headerButtons: {
    position: "absolute",
    top: STATUSBAR_HEIGHT + 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Avatar & Info
  profileInfoSection: { alignItems: "center", marginTop: -60 },
  avatarContainer: { alignItems: "center" },
  avatarImg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
  },
  statusBadge: {
    position: "absolute",
    top: -35,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    elevation: 3,
    shadowOpacity: 0.1,
  },
  statusText: { fontSize: 13, color: "#666" },
  statusArrow: {
    position: "absolute",
    bottom: -6,
    left: "45%",
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#fff",
  },
  userNameText: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 12,
    color: "#000",
  },
  editBioBtn: { flexDirection: "row", alignItems: "center", marginTop: 15 },
  editBioText: { color: "#00a3ff", marginLeft: 8, fontSize: 15 },

  // Actions
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 25,
    paddingHorizontal: 10,
  },
  actionButton: {
    alignItems: "center",
    marginHorizontal: 10,
    backgroundColor: "#f1f3f5",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    flexDirection: "row",
  },
  actionIconBg: { marginRight: 6 },
  actionText: { fontWeight: "600", color: "#333", fontSize: 13 },

  // Diary Empty
  emptyDiarySection: {
    marginTop: 60,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  diaryIllustration: {
    width: 100,
    height: 100,
    marginBottom: 20,
    position: "relative",
  },
  diaryImg: { width: "100%", height: "100%", opacity: 0.5 },
  heartIcon: { position: "absolute", top: 0, left: -10 },
  msgIcon: { position: "absolute", bottom: 10, right: -10 },
  diaryTitle: { fontSize: 18, fontWeight: "bold", color: "#000" },
  diarySub: {
    textAlign: "center",
    color: "#888",
    marginTop: 10,
    lineHeight: 20,
  },
  postBtn: {
    backgroundColor: "#007fff",
    paddingHorizontal: 35,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 25,
  },
  postBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  // Overlay Modals
  confirmOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  confirmBox: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  confirmTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  previewAvatar: { width: 180, height: 180, borderRadius: 90 },
  previewCover: { width: "100%", height: 160, borderRadius: 10 },
  confirmActions: { flexDirection: "row", marginTop: 25, width: "100%" },
  btnCancel: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    backgroundColor: "#eee",
    borderRadius: 10,
    marginRight: 10,
  },
  btnSave: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    backgroundColor: "#007fff",
    borderRadius: 10,
  },
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
    fontSize: 14,
  },
});
