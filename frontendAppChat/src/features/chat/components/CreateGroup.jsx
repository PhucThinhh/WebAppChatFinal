import { useEffect, useState } from "react";
import { createGroupApi } from "../api/chatApi";
import axiosClient from "../../../services/axiosClient";
import { toast } from "react-toastify";
import { DEFAULT_AVATAR_URL, getImageUrl } from "../../../utils/imageUrl";

const DEFAULT_AVATAR = DEFAULT_AVATAR_URL;

export default function CreateGroup({ onCreated }) {
  const [groupName, setGroupName] = useState("");
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    try {
      const meRes = await axiosClient.get("/user/me");
      const me = meRes.data;
      setCurrentUser(me);
      console.log("CURRENT USER:", me);

      const friendRes = await axiosClient.get("/friends");
      const list = Array.isArray(friendRes.data) ? friendRes.data : [];
      setFriends(list);
      console.log("DANH SACH BAN BE JSON:", JSON.stringify(list, null, 2));
    } catch (error) {
      console.error("LỖI INIT:", error.response?.data || error.message);
    }
  };

  const getFriendId = (friend, meId) => {
    if (!friend) return NaN;

    const myId = Number(meId);

    const senderId =
      friend?.senderId !== undefined && friend?.senderId !== null
        ? Number(friend.senderId)
        : NaN;

    const receiverId =
      friend?.receiverId !== undefined && friend?.receiverId !== null
        ? Number(friend.receiverId)
        : NaN;

    // friendship object
    if (!Number.isNaN(senderId) && !Number.isNaN(receiverId)) {
      return senderId === myId ? receiverId : senderId;
    }

    // user-like object
    const directId = Number(
      friend?.userId ??
        friend?.friendId ??
        friend?.id
    );

    return directId;
  };

  const getFriendLabel = (friend, meId) => {
    return (
      friend?.username ||
      friend?.name ||
      friend?.fullName ||
      friend?.phone ||
      `User ${getFriendId(friend, meId)}`
    );
  };

  const resolveAvatar = (friend) => {
    return (
      getImageUrl(friend?.avatar || friend?.friendAvatar || friend?.user?.avatar) ||
      DEFAULT_AVATAR
    );
  };

  const toggleSelectFriend = (friend) => {
    if (!currentUser?.id) return;

    const friendId = getFriendId(friend, Number(currentUser.id));

    setSelectedFriends((prev) => {
      const existed = prev.some(
        (item) => getFriendId(item, Number(currentUser.id)) === friendId
      );

      if (existed) {
        return prev.filter(
          (item) => getFriendId(item, Number(currentUser.id)) !== friendId
        );
      }

      return [...prev, friend];
    });
  };

  const handleCreateGroup = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Không tìm thấy token, vui lòng đăng nhập lại");
        return;
      }

      if (!groupName.trim()) {
        alert("Vui lòng nhập tên nhóm");
        return;
      }

      if (selectedFriends.length < 2) {
        alert("Vui lòng chọn ít nhất 2 thành viên");
        return;
      }

      if (!currentUser?.id) {
        alert("Không tìm thấy thông tin người dùng");
        return;
      }

      setLoading(true);

      const memberIds = selectedFriends
        .map((item) => getFriendId(item, Number(currentUser.id)))
        .filter(
          (id) => !Number.isNaN(id) && id > 0 && id !== Number(currentUser.id)
        );

      if (!memberIds.length) {
        console.log("selectedFriends JSON:", JSON.stringify(selectedFriends, null, 2));
        alert("Không đọc được id thành viên");
        return;
      }

      const payload = {
        name: groupName.trim(),
        creatorId: Number(currentUser.id),
        memberIds,
      };

      console.log("PAYLOAD TẠO NHÓM JSON:", JSON.stringify(payload, null, 2));
      console.log("selectedFriends JSON:", JSON.stringify(selectedFriends, null, 2));

      const res = await createGroupApi(payload);

      console.log("TẠO NHÓM THÀNH CÔNG:", res.data);
      toast.success("Tạo nhóm thành công! 🎉");

      setGroupName("");
      setSelectedFriends([]);

      if (onCreated) onCreated(res.data);
    } catch (error) {
      console.error("LỖI TẠO NHÓM STATUS:", error.response?.status);
      console.error("LỖI TẠO NHÓM DATA JSON:", JSON.stringify(error.response?.data, null, 2));
      console.error("LỖI TẠO NHÓM FULL:", error);
      alert("Tạo nhóm thất bại");
    } finally {
      setLoading(false);
    }
  };

  const meId = Number(currentUser?.id || 0);

  return (
    <div
      style={{
        margin: "18px 16px",
        padding: "18px",
        border: "1px solid rgba(37, 99, 235, 0.14)",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.88)",
        boxShadow: "0 18px 45px rgba(15,23,42,0.08)",
        backdropFilter: "blur(14px)",
      }}
    >
      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Tên nhóm"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          style={{
            width: "100%",
            height: "42px",
            borderRadius: "12px",
            border: "1px solid rgba(37,99,235,0.18)",
            background: "#ffffff",
            color: "#0f172a",
            padding: "0 14px",
            outline: "none",
            fontWeight: "700",
          }}
        />
      </div>

      <div
        style={{
          maxHeight: "180px",
          overflowY: "auto",
          marginBottom: "10px",
          border: "1px solid rgba(15,23,42,0.08)",
          borderRadius: "14px",
          padding: "8px",
          background: "#f8fafc",
        }}
      >
        {friends.length === 0 ? (
          <div style={{ color: "#64748b", fontSize: "14px" }}>
            Chưa có bạn bè để chọn
          </div>
        ) : (
          friends.map((friend, index) => {
            const friendId = getFriendId(friend, meId);
            const checked = selectedFriends.some(
              (item) => getFriendId(item, meId) === friendId
            );

            return (
              <label
                key={friendId || index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: checked ? "rgba(22,119,255,0.12)" : "transparent",
                  color: "#0f172a",
                  fontWeight: 700,
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSelectFriend(friend)}
                />
                <img
                  src={resolveAvatar(friend)}
                  alt={getFriendLabel(friend, meId)}
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_AVATAR;
                  }}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "9999px",
                    objectFit: "cover",
                    flexShrink: 0,
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                />
                <span>{getFriendLabel(friend, meId)}</span>
              </label>
            );
          })
        )}
      </div>

      <button
        onClick={handleCreateGroup}
        disabled={loading}
        style={{
          width: "100%",
          height: "42px",
          border: "none",
          borderRadius: "8px",
          background: "#1677ff",
          color: "#fff",
          fontWeight: "600",
          cursor: "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Đang tạo..." : "Tạo nhóm"}
      </button>
    </div>
  );
}
