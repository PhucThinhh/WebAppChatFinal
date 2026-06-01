import { useEffect, useState } from "react";
import {
  acceptFriendApi,
  getFriendRequestsApi,
  rejectFriendApi,
} from "../api/friendApi";
import { DEFAULT_AVATAR_URL, getImageUrl } from "../../../utils/imageUrl";

function FriendRequests() {
  const [requests, setRequests] = useState([]);

  const loadRequests = async () => {
    try {
      const res = await getFriendRequestsApi();
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleAccept = async (id) => {
    try {
      await acceptFriendApi(id);
      loadRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectFriendApi(id);
      loadRequests();
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
        requests.map((request) => {
          const requestId = request.friendshipId || request.id;

          return (
            <div
              key={requestId}
              className="flex items-center justify-between bg-slate-800 p-3 rounded-xl mb-2"
            >
              <div className="flex items-center gap-3">
                <img
                  src={getImageUrl(request.avatar) || DEFAULT_AVATAR_URL}
                  className="w-10 h-10 rounded-full object-cover bg-slate-700"
                  alt="avatar"
                  onError={(event) => {
                    event.currentTarget.src = DEFAULT_AVATAR_URL;
                  }}
                />
                <span className="text-white">{request.username}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(requestId)}
                  className="bg-green-500 px-3 py-1 rounded text-white"
                >
                  Chấp nhận
                </button>

                <button
                  onClick={() => handleReject(requestId)}
                  className="bg-red-500 px-3 py-1 rounded text-white"
                >
                  Từ chối
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default FriendRequests;
