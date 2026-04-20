import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import ChatBox from "../components/chatBox";
import ChatInput from "../components/ChatInput";
import CreateGroup from "../components/CreateGroup";

import FriendsList from "../../friend/components/FriendsList";
import FriendRequests from "../../friend/components/FriendRequests";
import FriendSearch from "../../friend/components/FriendSearch";

import useChat from "../hooks/useChat";
import useUser from "../hooks/useUser";

import ProfileModal from "../../user/components/ProfileModal";
import ChangePasswordModal from "../../user/components/ChangePasswordModal";



import {
  disconnectSocket,
  joinRoom,
  subscribeOnlineList,
} from "../socket/socket";

import {
  deleteConversationApi,
  blockUserApi,
  getBlockStatusApi,
  unblockUserApi,
} from "../api/chatApi";

import {
  connectSocket,
  sendMessageSocket,
  subscribeUserStatus,
} from "../socket/socket";

import { getMessagesApi } from "../api/chatApi";

function ChatPage() {
  const navigate = useNavigate();

  const { messages, setMessages, input, setInput, addMessage, messagesEndRef } =
    useChat();

  const { user, fetchUser } = useUser();

  const [activeTab, setActiveTab] = useState("chat");
  const [selectedUser, setSelectedUser] = useState(null);

  const [showProfile, setShowProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // ================= ONLINE USERS STATE =================
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const [showMenu, setShowMenu] = useState(false);

  const [forwardMessage, setForwardMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState(null);

const [blockStatus, setBlockStatus] = useState({
  blockedByMe: false,
  blockedByOther: false,
});
  const handleForwardClick = (msg) => {
    setForwardMessage(msg);
    setShowForwardModal(true);
  };

  const handleForwardToUser = (user) => {
    if (!forwardMessage) return;

    const newRoomId = [Number(currentUserId), Number(user.id)]
      .sort((a, b) => a - b)
      .join("_");

    const msg = {
      senderId: Number(currentUserId),
      receiverId: Number(user.id),
      roomId: newRoomId,

      content: forwardMessage.content,
      fileUrl: forwardMessage.fileUrl,
      type: forwardMessage.type === "FILE" ? "FILE" : "FORWARD",

      originalSenderId: forwardMessage.senderId,
      originalContent: forwardMessage.content,
      originalMessageId: forwardMessage.id,
    };

    sendMessageSocket(msg);
    setShowForwardModal(false);
    setForwardMessage(null);
  };

  

  // ================= SOCKET CONNECT =================
  useEffect(() => {
    if (!user?.id) return;

    let statusSub = null;
    let listSub = null;

    connectSocket(user.id, () => {
      // 🔥 1. sync toàn bộ user online
      listSub = subscribeOnlineList((list) => {
        console.log("👥 LIST:", list);

        const newSet = new Set(list.map((id) => Number(id)));
        setOnlineUsers(newSet);
      });

      // 🔥 2. realtime update
      statusSub = subscribeUserStatus((data) => {
        console.log("🔥 STATUS:", data);

        setOnlineUsers((prev) => {
          const newSet = new Set(prev);

          const userId = Number(data.userId);

          if (data.status === "ONLINE") {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }

          return newSet;
        });
      });
    });

    // 🔥 cleanup ĐÚNG CHỖ
    return () => {
      statusSub?.unsubscribe();
      listSub?.unsubscribe();
    };
  }, [user?.id]);

  // ================= CURRENT USER =================
  const currentUserId = user?.id || user?._id;

  // ================= ROOM ID =================
  const roomId = useMemo(() => {
    // 🔥 GROUP
    if (selectedGroup) {
      return `group_${selectedGroup.id}`;
    }

    // 🔥 1vs1
    if (!currentUserId || (!selectedUser && !selectedGroup)) return;

    return [Number(currentUserId), Number(selectedUser.id)]
      .sort((a, b) => a - b)
      .join("_");
  }, [currentUserId, selectedUser, selectedGroup]);

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    setSelectedUser(null); // 🔥 QUAN TRỌNG
    setActiveTab("chat");
  };

  const handleDeleteConversation = async () => {
    if (!roomId) return;

    try {
      await deleteConversationApi(roomId);

      // 🔥 reset UI giống Zalo
      setMessages([]);
      setSelectedUser(null);

      setShowMenu(false);
    } catch (error) {
      console.error("❌ Lỗi xoá hội thoại:", error);
    }
  };

  // ================= LOAD HISTORY =================
  useEffect(() => {
    if (!roomId) return;

    const loadHistory = async () => {
      try {
        const res = await getMessagesApi(roomId);
        console.log("API DATA:", res.data); // 🔥 thêm dòng này

        const history = res.data.map((msg) => ({
          id: msg.id || msg._id,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          content: msg.content,
          createdAt: msg.createdAt,
          deletedBy: msg.deletedBy,
          isRecalled: msg.isRecalled,
          fileUrl: msg.fileUrl,
          type: msg.type,
          originalSenderId: msg.originalSenderId,
          originalContent: msg.originalContent,
        }));

        setMessages(history);
      } catch (err) {
        console.error("Load history lỗi:", err);
      }
    };

    setMessages([]);
    loadHistory();
  }, [roomId]);

  useEffect(() => {
    const handleLogoutSync = (event) => {
      if (event.key === "logout") {
        navigate("/", { replace: true });
      }
    };

    window.addEventListener("storage", handleLogoutSync);

    return () => {
      window.removeEventListener("storage", handleLogoutSync);
    };
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  // ================= RECEIVE MESSAGE =================

  // ================= JOIN ROOM =================

  // ================= SEND MESSAGE =================

  useEffect(() => {
    if (!roomId || !currentUserId) return;

    const subscription = joinRoom(
      roomId,

      // message
      (message) => {
        if (!message) return;

        addMessage({
          id: message.id,
          senderId: message.senderId,
          receiverId: message.receiverId,
          content: message.content,
          createdAt: message.createdAt,
          isRecalled: message.isRecalled,
          fileUrl: message.fileUrl,

          // 🔥 THÊM 3 DÒNG NÀY
          type: message.type,
          originalSenderId: message.originalSenderId,
          originalContent: message.originalContent,
        });
      },

      // delete
      (deletedId) => {
        setMessages((prev) =>
          prev.map((m) =>
            String(m.id || m._id) === String(deletedId)
              ? { ...m, deletedBy: currentUserId }
              : m
          )
        );
      },

      // 🔥 RECALL (THÊM MỚI)
      (recallId) => {
        setMessages((prev) =>
          prev.map((m) =>
            String(m.id || m._id) === String(recallId)
              ? { ...m, isRecalled: true }
              : m
          )
        );
      }
    );

    return () => {
      subscription?.unsubscribe?.();
    };
  }, [roomId, currentUserId]);

  const handleSendMessage = () => {
    if (blockStatus.blockedByMe || blockStatus.blockedByOther) {
      alert("Không thể gửi tin nhắn");
      return;
    }

    if (!input?.trim()) return;
    if (!currentUserId || (!selectedUser && !selectedGroup)) return;

    const msg = {
      senderId: Number(currentUserId),
      receiverId: selectedUser?.id || null,
      roomId,
      content: input,
      type: "TEXT",
    };

    sendMessageSocket(msg);
    setInput("");
  };

  const handleSendFile = (fileUrl) => {
    if (blockStatus.blockedByMe || blockStatus.blockedByOther) { 
      alert("Bạn đã chặn người này");
      return;
    }

    if (!currentUserId || (!selectedUser && !selectedGroup)) return;

    const msg = {
      senderId: Number(currentUserId),
      receiverId: selectedUser?.id || null,
      roomId,
      type: "FILE",
      fileUrl,
    };

    sendMessageSocket(msg);
  };
  // ================= SELECT USER =================
  const handleSelectUser = async (u) => {
    const userId = u.friendId || u.userId || u.id;

    setSelectedUser({
      id: userId,
      username: u.username,
      avatar: u.avatar,
    });

    setActiveTab("chat");

    // 🔥 CHECK BLOCK
    try {
      const res = await getBlockStatusApi(userId);

      setBlockStatus({
        blockedByMe: res.data?.blockedByMe ?? false,
        blockedByOther: res.data?.blockedByOther ?? false,
      });
    } catch (err) {
      console.log("Check block lỗi", err);
    }
  };

  // ================= LOGOUT =================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    // 🔥 disconnect socket ngay
    disconnectSocket();

    // 🔥 trigger sync across tabs (đúng cách)
    localStorage.setItem("logout", Date.now());

    navigate("/", { replace: true });
  };

  return (
    <div className="w-screen h-screen flex bg-[#0f172a] overflow-hidden text-slate-200 font-sans relative">
      {/* SIDEBAR */}
      <div className="z-30 border-r border-slate-800/60 shadow-2xl bg-[#0b1120]">
        <Sidebar
          user={user}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          onLogout={handleLogout}
          onOpenProfile={() => setShowProfile(true)}
          onChangePassword={() => setShowChangePassword(true)}
          onSelectTab={setActiveTab}
          activeTab={activeTab}
        />
      </div>

      {/* MAIN */}
      <main className="flex-1 flex flex-col bg-gradient-to-b from-[#1e293b] to-[#0f172a] relative z-10">
        {/* CHAT TAB */}
        {activeTab === "chat" &&
          (!selectedUser ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center shadow-inner">
                <span className="text-4xl">💬</span>
              </div>
              <p className="text-slate-500 font-medium">
                Chọn một cuộc trò chuyện để bắt đầu
              </p>
            </div>
          ) : (
            <>
              {/* HEADER */}
              <header className="h-20 px-8 flex items-center justify-between bg-slate-900/40 backdrop-blur-xl border-b border-white/5 shadow-lg z-20">
                {/* USER INFO */}
                <div className="flex items-center gap-4">
                  <div className="relative group cursor-pointer">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-75 group-hover:opacity-100 transition duration-300 blur-[2px]"></div>
                    <img
                      src={selectedUser.avatar || "/default-avatar.png"}
                      alt="avatar"
                      className="relative w-12 h-12 rounded-full object-cover border-2 border-slate-900"
                      onError={(e) => (e.target.src = "/default-avatar.png")}
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-slate-800 ${
                        onlineUsers.has(Number(selectedUser.id))
                          ? "bg-emerald-500"
                          : "bg-slate-500"
                      }`}
                    />
                  </div>

                  <div className="flex flex-col">
                    <h2 className="text-white text-lg font-bold tracking-tight uppercase">
                      {selectedGroup
                        ? selectedGroup.name
                        : selectedUser.username}
                    </h2>
                    <div className="flex items-center gap-1.5">
                      {onlineUsers.has(Number(selectedUser.id)) ? (
                        <>
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                          <span className="text-xs text-emerald-400 font-medium">
                            Đang hoạt động
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">
                          Ngoại tuyến
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-2 relative">
                  {/* SEARCH */}
                  <button className="p-2.5 rounded-full hover:bg-white/5 text-slate-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </button>

                  {/* MENU */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu((prev) => !prev);
                    }}
                    className="p-2.5 rounded-full hover:bg-white/5 text-slate-400 text-xl"
                  >
                    ⋮
                  </button>

                  {/* DROPDOWN */}
                  {showMenu && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-12 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                      {/* 🔥 BLOCK */}
                      <button
                        onClick={async () => {
                          try {
                            if (blockStatus.blockedByMe) {
                              await unblockUserApi(selectedUser.id);
                            } else {
                              await blockUserApi(selectedUser.id);
                            }

                            const res = await getBlockStatusApi(
                              selectedUser.id
                            );

                            setBlockStatus({
                              blockedByMe: res.data?.blockedByMe ?? false,
                              blockedByOther: res.data?.blockedByOther ?? false,
                            });

                            setShowMenu(false);
                          } catch (err) {
                            console.log("Block/unblock lỗi:", err);
                          }
                        }}
                        className={`w-full text-left px-4 py-3 transition ${
                          blockStatus.blockedByMe
                            ? "hover:bg-green-500/10 text-green-400"
                            : "hover:bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {blockStatus.blockedByMe
                          ? "🔓 Bỏ chặn"
                          : "🚫 Chặn người dùng"}
                      </button>

                      {/* 🔥 DIVIDER */}
                      <div className="h-px bg-slate-700" />

                      {/* DELETE */}
                      <button
                        onClick={handleDeleteConversation}
                        className="w-full text-left px-4 py-3 hover:bg-red-500/10 text-red-400 transition"
                      >
                        🗑️ Xoá hội thoại
                      </button>
                    </div>
                  )}
                </div>
              </header>

              {/* CHAT BOX */}
              <div className="flex-1 relative overflow-hidden">
                <ChatBox
                  messages={messages}
                  messagesEndRef={messagesEndRef}
                  currentUserId={currentUserId}
                  setMessages={setMessages}
                  onForwardMessage={handleForwardClick}
                />
              </div>

              {/* INPUT */}
              <div className="p-4 bg-transparent">
                {blockStatus.blockedByMe ? (
                  <div className="text-center text-red-400">
                    🚫 Bạn đã chặn người này
                  </div>
                ) : blockStatus.blockedByOther ? (
                  <div className="text-center text-yellow-400">
                    ⚠️ Bạn đã bị người này chặn
                  </div>
                ) : (
                  <ChatInput
                    input={input}
                    setInput={setInput}
                    onSend={handleSendMessage}
                    onSendFile={handleSendFile}
                  />
                )}
              </div>
            </>
          ))}

        {/* OTHER TABS */}
        {activeTab !== "chat" && (
          <div className="flex-1 p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {activeTab === "friends" && (
              <FriendsList
                onSelectUser={handleSelectUser}
                onlineUsers={onlineUsers}
              />
            )}
            {activeTab === "requests" && <FriendRequests />}
            {activeTab === "search" && (
              <FriendSearch onSelectUser={handleSelectUser} />
            )}
          </div>
        )}

        {activeTab === "group" && (
          <CreateGroup
            user={user}
            friends={[]} // 👉 tạm thời để trống hoặc truyền FriendsList sau
            onCreated={(group) => {
              handleSelectGroup(group);
            }}
          />
        )}
      </main>

      {/* MODALS */}
      {showForwardModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999]">
          <div className="bg-slate-800 p-4 rounded-xl w-96 max-h-[500px] overflow-y-auto">
            <h3 className="text-white mb-3">Chọn người để chuyển tiếp</h3>

            <FriendsList onSelectUser={(user) => handleForwardToUser(user)} />

            <button
              onClick={() => setShowForwardModal(false)}
              className="mt-3 text-sm text-slate-400"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
      {(showProfile || showChangePassword) && (
        <div className="fixed inset-0 flex items-center justify-center z-[999]">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setShowProfile(false);
              setShowChangePassword(false);
            }}
          ></div>

          <div className="relative z-[1000] shadow-2xl">
            {showProfile && (
              <ProfileModal
                onClose={() => setShowProfile(false)}
                refreshUser={fetchUser}
              />
            )}
            {showChangePassword && (
              <ChangePasswordModal
                onClose={() => setShowChangePassword(false)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPage;
