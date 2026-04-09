import { Feather, Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getMeApi } from "../src/features/user/api/userApi";

export default function ProfileInfo() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      fetchUser();
    }, [])
  );

  const fetchUser = async () => {
    try {
      const res = await getMeApi();
      setUser(res.data);
    } catch (err) {
      console.log("Lỗi lấy user:", err);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "Chưa cập nhật";
    return new Date(date).toLocaleDateString("vi-VN");
  };

  const formatGender = (gender: string) => {
    if (gender === "MALE") return "Nam";
    if (gender === "FEMALE") return "Nữ";
    return "Chưa cập nhật";
  };

  // 👉 loading
  if (!user) {
    return (
      <View style={styles.loading}>
        <Text>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <Image
            source={{
              uri:
                user.coverImage ||
                "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
            }}
            style={styles.coverImage}
            blurRadius={10}
          />

          <View style={styles.overlay} />

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.profileHeaderInfo}>
            <Image
              source={{
                uri:
                  user.avatar ||
                  "https://randomuser.me/api/portraits/men/32.jpg",
              }}
              style={styles.avatar}
            />
            <Text style={styles.usernameText}>{user.username || "User"}</Text>
          </View>
        </View>

        {/* INFO */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Giới tính</Text>
            <Text style={styles.value}>{formatGender(user.gender)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Ngày sinh</Text>
            <Text style={styles.value}>{formatDate(user.birthday)}</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.phoneLabelContainer}>
              <Text style={styles.label}>Điện thoại</Text>
              <Text style={styles.value}>{user.phone || "Chưa cập nhật"}</Text>
            </View>
          </View>

          <Text style={styles.noteText}>
            Số điện thoại chỉ hiển thị với người có lưu số bạn trong danh bạ máy
          </Text>

          {/* 👉 NÚT CHỈNH SỬA */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => router.push("/editprofile")}
          >
            <Feather name="edit-2" size={18} color="#333" />
            <Text style={styles.editButtonText}>Chỉnh sửa</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  headerContainer: {
    height: 220,
    position: "relative",
    justifyContent: "flex-end",
  },

  coverImage: {
    ...StyleSheet.absoluteFillObject,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 40,
    left: 15,
    zIndex: 10,
  },

  profileHeaderInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#fff",
  },

  usernameText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 15,
  },

  infoSection: {
    padding: 20,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 25,
    color: "#000",
  },

  infoRow: {
    flexDirection: "row",
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },

  label: {
    width: 100,
    fontSize: 15,
    color: "#333",
  },

  value: {
    fontSize: 15,
    color: "#000",
    flex: 1,
  },

  phoneLabelContainer: {
    flexDirection: "row",
    flex: 1,
  },

  noteText: {
    fontSize: 13,
    color: "#888",
    marginTop: 8,
    lineHeight: 18,
  },

  editButton: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    marginTop: 40,
    paddingVertical: 12,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },

  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
});
