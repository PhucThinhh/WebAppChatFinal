import { useEffect, useState, useMemo } from "react";
import { getFriendsApi } from "../api/friendApi";

function FriendsList({ data, onSelectUser, onlineUsers = new Set() }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  // ================= FETCH FRIENDS =================
  useEffect(() => {
    if (data) {
      setFriends(data); // 🔥 dùng data từ ngoài
      setLoading(false);
      return;
    }

    const fetchFriends = async () => {
      try {
        const res = await getFriendsApi();
        setFriends(res.data || res || []);
      } catch (err) {
        console.error("Load friends error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [data]);

  // ================= FORMAT DATA =================
  const formatFriendData = (f) => ({
    id: Number(f.userId || f.friendId || f._id), // 🔥 ép về number
    username: f.username || f.friendName || f.user?.username || "Người dùng",
    avatar:
      f.avatar || f.friendAvatar || f.user?.avatar || "/default-avatar.png",
  });

  // ================= SORT ONLINE FIRST =================
  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => {
      const fa = formatFriendData(a);
      const fb = formatFriendData(b);

      const aOnline = onlineUsers.has(fa.id);
      const bOnline = onlineUsers.has(fb.id);

      return bOnline - aOnline; // online lên trên
    });
  }, [friends, onlineUsers]);

  if (loading) return <div className="p-3 text-gray-400">Đang tải...</div>;

  return (
    <div className="p-3">
      <h3 className="text-white mb-4 font-semibold text-lg">
        Danh sách bạn bè
      </h3>

      {sortedFriends.length === 0 ? (
        <p className="text-gray-400 italic">
          Chưa có bạn bè nào trong danh sách
        </p>
      ) : (
        sortedFriends.map((f) => {
          const friend = formatFriendData(f);

          // 🔥 CHECK ONLINE (FIX CHUẨN)
          const isOnline = onlineUsers.has(friend.id);

          return (
            <div
              key={f.friendshipId || friend.id}
              onClick={() => onSelectUser(friend)}
              className="flex items-center justify-between bg-slate-800 p-3 rounded-xl mb-2 
                         hover:bg-slate-700 transition-all cursor-pointer group"
            >
              {/* LEFT */}
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

                  {/* 🔥 ONLINE DOT */}
                  <span
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-800 
                    ${isOnline ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}
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

              {/* RIGHT */}
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
