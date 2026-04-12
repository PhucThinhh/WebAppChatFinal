import { useState } from "react";
import { searchUserApi, sendFriendRequestApi } from "../api/friendApi";

function FriendSearch() {
  const [keyword, setKeyword] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔍 search
  const handleSearch = async () => {
    if (!keyword.trim()) return;

    try {
      setLoading(true);
      const res = await searchUserApi(keyword);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ➕ gửi lời mời
  const handleAddFriend = async (id) => {
    try {
      await sendFriendRequestApi(id);

      // update UI
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, status: "PENDING" } : u))
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-white font-bold mb-3">🔍 Tìm kiếm bạn bè</h2>

      {/* INPUT */}
      <div className="flex gap-2 mb-4">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Nhập tên / SĐT / email"
          className="flex-1 p-2 rounded bg-slate-800 text-white"
        />

        <button
          onClick={handleSearch}
          className="bg-indigo-500 px-4 rounded text-white"
        >
          Search
        </button>
      </div>

      {/* RESULT */}
      {loading ? (
        <p className="text-gray-400">Đang tìm...</p>
      ) : (
        users.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between bg-slate-800 p-3 rounded-xl mb-2"
          >
            {/* LEFT */}
            <div className="flex items-center gap-3">
              <img
                src={u.avatar}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="text-white">{u.username}</p>
              </div>
            </div>

            {/* RIGHT */}
            {u.status === "NONE" && (
              <button
                onClick={() => handleAddFriend(u.id)}
                className="bg-indigo-500 px-3 py-1 rounded text-white"
              >
                Kết bạn
              </button>
            )}

            {u.status === "PENDING" && (
              <button className="bg-gray-500 px-3 py-1 rounded text-white">
                Đã gửi
              </button>
            )}

            {u.status === "FRIEND" && (
              <button className="bg-green-600 px-3 py-1 rounded text-white">
                Bạn bè
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default FriendSearch;
