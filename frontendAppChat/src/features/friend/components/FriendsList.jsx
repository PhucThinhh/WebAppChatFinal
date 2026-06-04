import { useEffect, useState, useMemo } from "react";
import {
  getFriendsApi,
  removeFriendApi,
  searchUserApi,
  sendFriendRequestApi,
} from "../api/friendApi";
import { getNicknameApi } from "../../chat/api/chatApi";

function FriendsList({
  data,
  onSelectUser,
  onlineUsers = new Set(),
  currentUserId,
}) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  const [nicknameMap, setNicknameMap] = useState({});

  const [friendToRemove, setFriendToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // ================= FORMAT DATA =================
  const formatFriendData = (f) => ({
    id: Number(f.userId || f.friendId || f._id || f.id),
    username: f.username || f.friendName || f.user?.username || "Người dùng",
    avatar:
      f.avatar || f.friendAvatar || f.user?.avatar || "/default-avatar.png",
  });

  const getDisplayName = (friend) => {
    return nicknameMap[friend.id] || friend.username;
  };

  // ================= FETCH FRIENDS =================
  useEffect(() => {
    if (data) {
      setFriends(data);
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

  // ================= LOAD NICKNAMES =================
  useEffect(() => {
    if (!currentUserId || friends.length === 0) {
      setNicknameMap({});
      return;
    }

    const loadNicknames = async () => {
      const map = {};

      await Promise.all(
        friends.map(async (rawFriend) => {
          const friend = formatFriendData(rawFriend);

          if (!friend.id) return;

          const roomId = [Number(currentUserId), Number(friend.id)]
            .sort((a, b) => a - b)
            .join("_");

          try {
            const res = await getNicknameApi(roomId, friend.id);
            const nickname = res.data?.nickname || "";

            if (nickname.trim()) {
              map[friend.id] = nickname.trim();
            }
          } catch (error) {
            console.log("Load nickname friend lỗi:", error);
          }
        })
      );

      setNicknameMap(map);
    };

    loadNicknames();
  }, [friends, currentUserId]);

  // ================= SORT ONLINE FIRST =================
  const sortedFriends = useMemo(() => {
    return [...friends].sort((a, b) => {
      const fa = formatFriendData(a);
      const fb = formatFriendData(b);

      const aOnline = onlineUsers.has(fa.id);
      const bOnline = onlineUsers.has(fb.id);

      return bOnline - aOnline;
    });
  }, [friends, onlineUsers]);

  // ================= SEARCH USER =================
  const handleSearch = async () => {
    const q = keyword.trim();

    if (!q) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);

      const res = await searchUserApi(q);
      setSearchResults(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Search user error:", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleClearSearch = () => {
    setKeyword("");
    setSearchResults([]);
  };

  // ================= SEND FRIEND REQUEST =================
  const handleAddFriend = async (id) => {
    if (!id) return;

    try {
      await sendFriendRequestApi(id);

      setSearchResults((prev) =>
        prev.map((u) =>
          Number(u.id) === Number(id) ? { ...u, status: "PENDING" } : u
        )
      );
    } catch (err) {
      console.error("Send friend request error:", err);
      alert("Gửi lời mời kết bạn thất bại");
    }
  };

  // ================= OPEN REMOVE MODAL =================
  const openRemoveModal = (e, rawFriend) => {
    e.stopPropagation();

    const friend = formatFriendData(rawFriend);

    if (!friend.id) {
      alert("Không tìm thấy ID bạn bè");
      return;
    }

    setFriendToRemove({
      raw: rawFriend,
      ...friend,
      displayName: getDisplayName(friend),
    });
  };

  // ================= CONFIRM REMOVE FRIEND =================
  const confirmRemoveFriend = async () => {
    if (!friendToRemove?.id) return;

    try {
      setRemoving(true);

      await removeFriendApi(friendToRemove.id);

      setFriends((prev) =>
        prev.filter((item) => {
          const itemFriend = formatFriendData(item);
          return Number(itemFriend.id) !== Number(friendToRemove.id);
        })
      );

      setFriendToRemove(null);
    } catch (err) {
      console.error("Remove friend error:", err);
      alert("Xoá bạn bè thất bại");
    } finally {
      setRemoving(false);
    }
  };

  if (loading) {
    return <div className="p-3 text-gray-400">Đang tải...</div>;
  }

  return (
    <div className="p-3 relative">
      <h3 className="text-white mb-4 font-semibold text-lg">
        Danh sách bạn bè
      </h3>

      {/* SEARCH BOX */}
      <div className="flex gap-2 mb-4">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
          placeholder="Tìm tên / SĐT / email"
          className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white outline-none focus:border-indigo-500"
        />

        {keyword.trim() && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="px-3 rounded-xl bg-slate-700 text-slate-300 hover:bg-slate-600"
          >
            ✕
          </button>
        )}

        <button
          type="button"
          onClick={handleSearch}
          disabled={searching}
          className="px-4 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 disabled:opacity-50"
        >
          {searching ? "..." : "Tìm"}
        </button>
      </div>

      {/* SEARCH RESULTS */}
      {keyword.trim() && (
        <div className="mb-5">
          <div className="text-slate-400 text-sm mb-2">Kết quả tìm kiếm</div>

          {searching ? (
            <div className="text-gray-400 text-sm">Đang tìm...</div>
          ) : searchResults.length === 0 ? (
            <div className="text-gray-500 text-sm italic">Không có kết quả</div>
          ) : (
            searchResults.map((u) => {
              const isOnline = onlineUsers.has(Number(u.id));

              const userForChat = {
                id: u.id,
                username: u.username,
                avatar: u.avatar || "/default-avatar.png",
              };

              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between bg-slate-800 p-3 rounded-xl mb-2 hover:bg-slate-700 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={u.avatar || "/default-avatar.png"}
                        alt={u.username}
                        className="w-11 h-11 rounded-full object-cover border border-slate-600"
                        onError={(e) => {
                          e.currentTarget.src = "/default-avatar.png";
                        }}
                      />

                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-800 ${
                          isOnline
                            ? "bg-green-500 animate-pulse"
                            : "bg-gray-500"
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="text-white font-medium truncate">
                        {u.username}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {u.status === "NONE" && (
                      <button
                        type="button"
                        onClick={() => handleAddFriend(u.id)}
                        className="text-xs bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-lg text-white font-semibold"
                      >
                        Kết bạn
                      </button>
                    )}

                    {u.status === "PENDING" && (
                      <button
                        type="button"
                        disabled
                        className="text-xs bg-gray-500 px-3 py-1.5 rounded-lg text-white font-semibold opacity-80"
                      >
                        Đã gửi
                      </button>
                    )}

                    {u.status === "FRIEND" && (
                      <button
                        type="button"
                        onClick={() => onSelectUser(userForChat)}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                      >
                        Nhắn tin
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* FRIEND LIST */}
      <div className="text-slate-400 text-sm mb-2">Bạn bè của bạn</div>

      {sortedFriends.length === 0 ? (
        <p className="text-gray-400 italic">
          Chưa có bạn bè nào trong danh sách
        </p>
      ) : (
        sortedFriends.map((f) => {
          const friend = formatFriendData(f);
          const isOnline = onlineUsers.has(friend.id);
          const displayName = getDisplayName(friend);

          const selectedFriend = {
            ...friend,
            name: displayName,
            displayName,
          };

          return (
            <div
              key={f.friendshipId || friend.id}
              onClick={() => onSelectUser(selectedFriend)}
              className="flex items-center justify-between bg-slate-800 p-3 rounded-xl mb-2 
                         hover:bg-slate-700 transition-all cursor-pointer group"
            >
              {/* LEFT */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0">
                  <img
                    src={friend.avatar}
                    alt={displayName}
                    className="w-11 h-11 rounded-full object-cover border border-slate-600"
                    onError={(e) => {
                      e.currentTarget.src = "/default-avatar.png";
                    }}
                  />

                  <span
                    className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-800 ${
                      isOnline ? "bg-green-500 animate-pulse" : "bg-gray-500"
                    }`}
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-white font-medium group-hover:text-indigo-300 transition-colors truncate">
                    {displayName}
                  </p>

                  <p className="text-gray-400 text-xs">
                    {isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
                  </p>
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectUser(selectedFriend);
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Nhắn tin
                </button>

                <button
                  type="button"
                  onClick={(e) => openRemoveModal(e, f)}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold"
                >
                  Xoá bạn
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* CUSTOM CONFIRM MODAL */}
      {friendToRemove && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999]">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-[360px] p-5 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={friendToRemove.avatar}
                alt={friendToRemove.displayName || friendToRemove.username}
                className="w-12 h-12 rounded-full object-cover border border-slate-600"
                onError={(e) => {
                  e.currentTarget.src = "/default-avatar.png";
                }}
              />

              <div>
                <h4 className="text-white font-semibold text-base">
                  Xoá bạn bè?
                </h4>

                <p className="text-slate-400 text-sm">
                  {friendToRemove.displayName || friendToRemove.username}
                </p>
              </div>
            </div>

            <p className="text-slate-300 text-sm leading-relaxed mb-5">
              Bạn có chắc muốn xoá{" "}
              <span className="text-white font-medium">
                {friendToRemove.displayName || friendToRemove.username}
              </span>{" "}
              khỏi danh sách bạn bè không?
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={removing}
                onClick={() => setFriendToRemove(null)}
                className="px-4 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-50"
              >
                Huỷ
              </button>

              <button
                type="button"
                disabled={removing}
                onClick={confirmRemoveFriend}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {removing ? "Đang xoá..." : "Xoá bạn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FriendsList;
