import { useEffect, useState } from "react";
import { getFriendsApi } from "../api/friendApi";

function FriendsList({ onSelectUser, onlineUsers = new Set() }) {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await getFriendsApi();
        setFriends(res.data || []);
      } catch (err) {
        console.error("Load friends error:", err);
      }
    };

    fetchFriends();
  }, []);

  return (
    <div className="p-3">
      <h3 className="text-white mb-3 font-semibold">Danh sách bạn bè</h3>

      {friends.length === 0 ? (
        <p className="text-gray-400">Chưa có bạn bè</p>
      ) : (
        friends.map((f) => {
          const userId = String(f.userId);
          const isOnline = onlineUsers.has(userId);

          return (
            <div
              key={f.friendshipId || f.userId}
              onClick={() =>
                onSelectUser({
                  id: f.userId,
                  username: f.username,
                  avatar: f.avatar,
                })
              }
              className="flex items-center justify-between bg-slate-800 p-3 rounded-xl mb-2 hover:bg-slate-700 cursor-pointer"
            >
              {/* LEFT */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={f.avatar}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover"
                  />

                  {/* ONLINE DOT */}
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-800 ${
                      isOnline ? "bg-green-500" : "bg-gray-500"
                    }`}
                  />
                </div>

                <div>
                  <p className="text-white font-medium">{f.username}</p>
                  <p className="text-gray-400 text-xs">
                    {isOnline ? "Đang hoạt động" : "Offline"}
                  </p>
                </div>
              </div>

              {/* RIGHT */}
              <button
                className="text-sm text-indigo-400"
                onClick={(e) => {
                  e.stopPropagation();

                  onSelectUser({
                    id: f.userId,
                    username: f.username,
                    avatar: f.avatar,
                  });
                }}
              >
                Chat
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

export default FriendsList;
