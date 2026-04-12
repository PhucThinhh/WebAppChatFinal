import { useEffect, useState } from "react";
import {
  getFriendRequestsApi,
  acceptFriendApi,
  rejectFriendApi,
} from "../api/friendApi";

function FriendRequests() {
  const [requests, setRequests] = useState([]);

  const loadRequests = async () => {
    try {
      const res = await getFriendRequestsApi();
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await getFriendRequestsApi();
        setRequests(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchRequests();
  }, []);

  const handleAccept = async (id) => {
    try {
      await acceptFriendApi(id);
      loadRequests(); // 🔥 refresh
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectFriendApi(id);
      loadRequests(); // 🔥 refresh
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-white font-bold mb-4">Lời mời kết bạn</h2>

      {requests.length === 0 ? (
        <p className="text-gray-400">Không có lời mời nào</p>
      ) : (
        requests.map((r) => (
          <div
            key={r.friendshipId || r.id}
            className="flex items-center justify-between bg-slate-800 p-3 rounded-xl mb-2"
          >
            {/* LEFT */}
            <div className="flex items-center gap-3">
              <img
                src={r.avatar}
                className="w-10 h-10 rounded-full"
                alt="avatar"
              />
              <span className="text-white">{r.username}</span>
            </div>

            {/* RIGHT */}
            <div className="flex gap-2">
              <button
                onClick={() => handleAccept(r.friendshipId || r.id)}
                className="bg-green-500 px-3 py-1 rounded text-white"
              >
                Accept
              </button>

              <button
                onClick={() => handleReject(r.friendshipId || r.id)}
                className="bg-red-500 px-3 py-1 rounded text-white"
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default FriendRequests;
