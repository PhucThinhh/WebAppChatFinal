import { useEffect, useState } from "react";
import { getFriendsApi } from "../api/friendApi";

function FriendsList({ onSelectUser, onlineUsers = new Set() }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await getFriendsApi();
        // Giả sử API trả về mảng trực tiếp hoặc trong res.data
        setFriends(res.data || res || []);
      } catch (err) {
        console.error("Load friends error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, []);

  // Hàm helper để chuẩn hóa dữ liệu bạn bè (Tránh lặp logic)
  const formatFriendData = (f) => ({
    id: f.userId || f.friendId || f._id,
    username: f.username || f.friendName || f.user?.username || "Người dùng",
    avatar:
      f.avatar || f.friendAvatar || f.user?.avatar || "/default-avatar.png",
  });

  if (loading) return <div className="p-3 text-gray-400">Đang tải...</div>;

  return (
    <div className="p-3">
      <h3 className="text-white mb-4 font-semibold text-lg">
        Danh sách bạn bè
      </h3>

      {friends.length === 0 ? (
        <p className="text-gray-400 italic">
          Chưa có bạn bè nào trong danh sách
        </p>
      ) : (
        friends.map((f) => {
          const friend = formatFriendData(f);
          const isOnline = onlineUsers.has(String(friend.id));

          return (
            <div
              key={f.friendshipId || friend.id}
              onClick={() => onSelectUser(friend)}
              className="flex items-center justify-between bg-slate-800 p-3 rounded-xl mb-2 
                         hover:bg-slate-700 transition-colors cursor-pointer group"
            >
              {/* LEFT: Info */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={friend.avatar}
                    alt={friend.username}
                    className="w-11 h-11 rounded-full object-cover border border-slate-600"
                    onError={(e) => {
                      e.target.src = "/default-avatar.png";
                    }}
                  />
                  <span
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-800 
                      ${isOnline ? "bg-green-500" : "bg-gray-500"}`}
                  />
                </div>

                <div>
                  <p className="text-white font-medium group-hover:text-indigo-300 transition-colors">
                    {friend.username}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                  </p>
                </div>
              </div>

              {/* RIGHT: Action */}
              <div className="text-xs text-indigo-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Nhắn tin
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default FriendsList;
