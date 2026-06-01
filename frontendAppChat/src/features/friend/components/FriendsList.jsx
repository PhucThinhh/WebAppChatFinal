import { useEffect, useMemo, useState } from "react";
import { getFriendsApi } from "../api/friendApi";
import { DEFAULT_AVATAR_URL, getImageUrl } from "../../../utils/imageUrl";

function FriendsList({ data, onSelectUser, onlineUsers = new Set() }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (data) {
      setFriends(Array.isArray(data) ? data : []);
      setLoading(false);
      return;
    }

    const fetchFriends = async () => {
      try {
        setError("");
        setLoading(true);
        const res = await getFriendsApi();
        const payload = res.data?.data || res.data?.friends || res.data || [];
        setFriends(Array.isArray(payload) ? payload : []);
      } catch (err) {
        console.error("Load friends error:", err);
        const status = err.response?.status;
        const message =
          err.response?.data?.message ||
          (typeof err.response?.data === "string" ? err.response.data : "") ||
          err.message;
        setError(
          status
            ? `Không tải được danh sách bạn bè (${status})`
            : message || "Không tải được danh sách bạn bè"
        );
        setFriends([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [data]);

  const formatFriendData = (f) => ({
    id: Number(f.userId || f.friendId || f.id || f._id),
    username:
      f.username || f.friendName || f.name || f.user?.username || "Người dùng",
    avatar: f.avatar || f.friendAvatar || f.user?.avatar || "",
    email: f.email || f.friendEmail || f.user?.email || "",
  });

  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => {
      const fa = formatFriendData(a);
      const fb = formatFriendData(b);

      const aOnline = onlineUsers.has(fa.id);
      const bOnline = onlineUsers.has(fb.id);

      return Number(bOnline) - Number(aOnline);
    });
  }, [friends, onlineUsers]);

  if (loading) return <div className="p-3 text-gray-500">Đang tải...</div>;
  if (error) return <div className="p-3 text-red-500 font-medium">{error}</div>;

  return (
    <div className="p-3">
      <h3 className="friend-list-title">Danh sách bạn bè</h3>

      {sortedFriends.length === 0 ? (
        <p className="text-gray-500 italic">
          Chưa có bạn bè nào trong danh sách
        </p>
      ) : (
        sortedFriends.map((f) => {
          const friend = formatFriendData(f);
          const isOnline = onlineUsers.has(friend.id);

          return (
            <div
              key={f.friendshipId || friend.id}
              onClick={() => onSelectUser(friend)}
              className="flex items-center justify-between bg-slate-800 p-3 rounded-xl mb-2 hover:bg-slate-700 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={getImageUrl(friend.avatar) || DEFAULT_AVATAR_URL}
                    alt={friend.username}
                    className="w-11 h-11 rounded-full object-cover border border-slate-600 bg-slate-700"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_AVATAR_URL;
                    }}
                  />

                  <span
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-800 ${
                      isOnline ? "bg-green-500 animate-pulse" : "bg-gray-500"
                    }`}
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
