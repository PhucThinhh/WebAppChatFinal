import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons
} from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#00a3ff", // Màu xanh Zalo khi chọn
        tabBarInactiveTintColor: "#707070", // Màu xám khi không chọn
        headerShown: false, // Ẩn header mặc định của Tab
        tabBarStyle: {
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#f0f0f0",
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      {/* TAB TIN NHẮN */}
      <Tabs.Screen
        name="chat" // hoặc "chat" tùy tên file của bạn
        options={{
          title: "Tin nhắn",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ width: 24, height: 24 }}>
              <Ionicons
                name={
                  focused
                    ? "chatbubble-ellipses"
                    : "chatbubble-ellipses-outline"
                }
                size={24}
                color={color}
              />
              {/* Badge thông báo màu đỏ */}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>5+</Text>
              </View>
            </View>
          ),
        }}
      />

      {/* TAB DANH BẠ */}
      <Tabs.Screen
        name="contacts"
        options={{
          title: "Danh bạ",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person-add" : "person-add-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* TAB KHÁM PHÁ */}
      <Tabs.Screen
        name="discovery"
        options={{
          title: "Khám phá",
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? "view-grid" : "view-grid-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* TAB NHẬT KÝ */}
      <Tabs.Screen
        name="timeline"
        options={{
          title: "Nhật ký",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "time" : "time-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* TAB CÁ NHÂN */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Cá nhân",
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome5
              name={focused ? "user-alt" : "user"}
              size={20}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    right: -12,
    top: -4,
    backgroundColor: "#ff3b30",
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "bold",
  },
});
