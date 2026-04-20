import { useEffect, useState } from "react";
import { createGroupApi } from "../api/chatApi";
import axiosClient from "../../../services/axiosClient";

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

      if (!selectedFriends.length) {
        alert("Vui lòng chọn ít nhất 1 thành viên");
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
      alert("Tạo nhóm thành công");

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
        padding: "12px",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(0,0,0,0.08)",
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
            borderRadius: "8px",
            border: "1px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.06)",
            color: "#fff",
            padding: "0 12px",
            outline: "none",
          }}
        />
      </div>

      <div
        style={{
          maxHeight: "180px",
          overflowY: "auto",
          marginBottom: "10px",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "8px",
          padding: "8px",
        }}
      >
        {friends.length === 0 ? (
          <div style={{ color: "#cbd5e1", fontSize: "14px" }}>
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
                  background: checked ? "rgba(22,119,255,0.15)" : "transparent",
                  color: "#fff",
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSelectFriend(friend)}
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