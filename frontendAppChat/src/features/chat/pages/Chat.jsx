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

const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="%231e293b"/><circle cx="32" cy="24" r="12" fill="%23e2e8f0"/><path d="M12 56c4-12 14-18 20-18s16 6 20 18" fill="%23e2e8f0"/></svg>';

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

  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const [showMenu, setShowMenu] = useState(false);

  const [forwardMessage, setForwardMessage] = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(false);

  const [selectedGroup, setSelectedGroup] = useState(null);

  const [blockStatus, setBlockStatus] = useState({
    blockedByMe: false,
    blockedByOther: false,
  });

  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);

  const currentUserId = user?.id || user?._id;

  const conversationStorageKey = useMemo(() => {
    if (!currentUserId) return null;
    return `chat_conversations_${currentUserId}`;
  }, [currentUserId]);

  const resolveAvatar = (avatar) => {
    if (!avatar) return DEFAULT_AVATAR;
    if (avatar.startsWith("data:image")) return avatar;
    if (avatar.startsWith("http")) return avatar;
    return `http://localhost:8080${avatar}`;
  };

  const upsertConversation = (conversation) => {
    setConversations((prev) => {
      const existed = prev.find((item) => item.id === conversation.id);

      if (existed) {
        return [
          { ...existed, ...conversation },
          ...prev.filter((item) => item.id !== conversation.id),
        ];
      }

      return [conversation, ...prev];
    });
  };

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

  useEffect(() => {
    if (!conversationStorageKey) return;

    try {
      const saved = localStorage.getItem(conversationStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setConversations(parsed);
        }
      }
    } catch (error) {
      console.log("Load conversations localStorage lỗi:", error);
    }
  }, [conversationStorageKey]);

  useEffect(() => {
    if (!conversationStorageKey) return;

    try {
      localStorage.setItem(conversationStorageKey, JSON.stringify(conversations));
    } catch (error) {
      console.log("Save conversations localStorage lỗi:", error);
    }
  }, [conversations, conversationStorageKey]);

  useEffect(() => {
    if (!user?.id) return;

    let statusSub = null;
    let listSub = null;

    connectSocket(user.id, () => {
      listSub = subscribeOnlineList((list) => {
        console.log("👥 LIST:", list);
        const newSet = new Set(list.map((id) => Number(id)));
        setOnlineUsers(newSet);
      });

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

    return () => {
      statusSub?.unsubscribe();
      listSub?.unsubscribe();
    };
  }, [user?.id]);

  const roomId = useMemo(() => {
    if (selectedGroup) {
      return `group_${selectedGroup.id}`;
    }

    if (!currentUserId || (!selectedUser && !selectedGroup)) return null;

    return [Number(currentUserId), Number(selectedUser.id)]
      .sort((a, b) => a - b)
      .join("_");
  }, [currentUserId, selectedUser, selectedGroup]);

  const handleSelectConversation = async (conversation) => {
    setSelectedConversationId(conversation.id);
    setActiveTab("chat");
    setShowMenu(false);

    if (conversation.type === "GROUP") {
      setSelectedGroup(conversation.targetGroup);
      setSelectedUser(null);
      setBlockStatus({
        blockedByMe: false,
        blockedByOther: false,
      });
      return;
    }

    setSelectedGroup(null);
    setSelectedUser(conversation.targetUser);

    try {
      const res = await getBlockStatusApi(conversation.targetUser.id);

      setBlockStatus({
        blockedByMe: res.data?.blockedByMe ?? false,
        blockedByOther: res.data?.blockedByOther ?? false,
      });
    } catch (err) {
      console.log("Check block lỗi", err);
    }
  };

  const handleSelectGroup = (group) => {
    const conversation = {
      id: `group_${group.id}`,
      type: "GROUP",
      name: group.name,
      avatar: DEFAULT_AVATAR,
      roomId: `group_${group.id}`,
      targetGroup: {
        id: group.id,
        name: group.name,
      },
    };

    upsertConversation(conversation);
    setSelectedConversationId(conversation.id);
    setSelectedGroup({
      id: group.id,
      name: group.name,
    });
    setSelectedUser(null);
    setShowMenu(false);
    setActiveTab("chat");
  };

  const handleDeleteConversation = async () => {
    if (!roomId) return;

    try {
      await deleteConversationApi(roomId);

      setMessages([]);
      setSelectedUser(null);
      setSelectedGroup(null);
      setSelectedConversationId(null);
      setConversations((prev) =>
        prev.filter((item) => item.roomId !== roomId)
      );
      setShowMenu(false);
    } catch (error) {
      console.error("❌ Lỗi xoá hội thoại:", error);
    }
  };

  useEffect(() => {
    if (!roomId) return;

    const loadHistory = async () => {
      try {
        const res = await getMessagesApi(roomId);
        console.log("API DATA:", res.data);

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
  }, [roomId, setMessages]);

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

  useEffect(() => {
    if (!roomId || !currentUserId) return;

    const subscription = joinRoom(
      roomId,
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
          type: message.type,
          originalSenderId: message.originalSenderId,
          originalContent: message.originalContent,
        });
      },
      (deletedId) => {
        setMessages((prev) =>
          prev.map((m) =>
            String(m.id || m._id) === String(deletedId)
              ? { ...m, deletedBy: currentUserId }
              : m
          )
        );
      },
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
  }, [roomId, currentUserId, addMessage, setMessages]);

  const handleSendMessage = () => {
    if (!selectedGroup && (blockStatus.blockedByMe || blockStatus.blockedByOther)) {
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

    if (selectedGroup) {
      upsertConversation({
        id: `group_${selectedGroup.id}`,
        type: "GROUP",
        name: selectedGroup.name,
        avatar: DEFAULT_AVATAR,
        roomId: `group_${selectedGroup.id}`,
        targetGroup: selectedGroup,
      });
    } else if (selectedUser) {
      const privateRoomId = [Number(currentUserId), Number(selectedUser.id)]
        .sort((a, b) => a - b)
        .join("_");

      upsertConversation({
        id: `private_${privateRoomId}`,
        type: "PRIVATE",
        name: selectedUser.username,
        avatar: resolveAvatar(selectedUser.avatar),
        roomId: privateRoomId,
        targetUser: selectedUser,
      });
    }

    setInput("");
  };

  const handleSendFile = (fileUrl) => {
    if (!selectedGroup && (blockStatus.blockedByMe || blockStatus.blockedByOther)) {
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

  const handleSelectUser = async (u) => {
    const userId = u.friendId || u.userId || u.id;

    const targetUser = {
      id: userId,
      username: u.username,
      avatar: u.avatar,
    };

    const privateRoomId = [Number(currentUserId), Number(userId)]
      .sort((a, b) => a - b)
      .join("_");

    const conversation = {
      id: `private_${privateRoomId}`,
      type: "PRIVATE",
      name: u.username,
      avatar: resolveAvatar(u.avatar),
      roomId: privateRoomId,
      targetUser,
    };

    setSelectedUser(targetUser);
    setSelectedGroup(null);
    setSelectedConversationId(conversation.id);
    setShowMenu(false);
    setActiveTab("chat");
    upsertConversation(conversation);

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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    disconnectSocket();

    localStorage.setItem("logout", Date.now());

    navigate("/", { replace: true });
  };

  const currentTitle = selectedGroup
    ? selectedGroup.name
    : selectedUser?.username || "Cuộc trò chuyện";

  const currentAvatar = selectedGroup
    ? DEFAULT_AVATAR
    : resolveAvatar(selectedUser?.avatar);

  return (
    <div className="w-screen h-screen flex bg-[#0f172a] overflow-hidden text-slate-200 font-sans relative">
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

      {(activeTab === "chat" || activeTab === "group") && (
        <aside className="w-[340px] shrink-0 border-r border-slate-800/60 bg-[#111827] flex flex-col">
          <div className="p-4 border-b border-slate-800/60">
            <div className="text-xl font-semibold text-white mb-1">
              Cuộc trò chuyện
            </div>
            <div className="text-sm text-slate-400">
              {conversations.length} hội thoại
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {conversations.length === 0 ? (
              <div className="text-slate-500 text-sm px-3 py-4">
                Chưa có cuộc trò chuyện nào
              </div>
            ) : (
              conversations.map((item) => {
                const isActive = selectedConversationId === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectConversation(item)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition ${
                      isActive
                        ? "bg-blue-500/20 border border-blue-500/30"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <img
                      src={item.avatar || DEFAULT_AVATAR}
                      alt=""
                      className="w-14 h-14 rounded-full object-cover bg-slate-700 shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_AVATAR;
                      }}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="text-white font-medium truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 truncate">
                        {item.type === "GROUP" ? "Nhóm chat" : "Chat cá nhân"}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>
      )}

      <main className="flex-1 flex flex-col bg-gradient-to-b from-[#1e293b] to-[#0f172a] relative z-10">
        {activeTab === "chat" &&
          (!selectedUser && !selectedGroup ? (
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
              <header className="h-20 px-8 flex items-center justify-between bg-slate-900/40 backdrop-blur-xl border-b border-white/5 shadow-lg z-20">
                <div className="flex items-center gap-4">
                  <div className="relative group cursor-pointer">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-75"></div>
                    <img
                      src={currentAvatar}
                      alt=""
                      className="relative w-12 h-12 rounded-full object-cover border-2 border-slate-900 bg-slate-700"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_AVATAR;
                      }}
                    />
                    {!selectedGroup && (
                      <span
                        className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-slate-800 ${
                          onlineUsers.has(Number(selectedUser?.id))
                            ? "bg-emerald-500"
                            : "bg-slate-500"
                        }`}
                      />
                    )}
                  </div>

                  <div className="flex flex-col">
                    <h2 className="text-white text-lg font-bold tracking-tight uppercase">
                      {currentTitle}
                    </h2>
                    <div className="flex items-center gap-1.5">
                      {!selectedGroup && onlineUsers.has(Number(selectedUser?.id)) ? (
                        <>
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                          <span className="text-xs text-emerald-400 font-medium">
                            Đang hoạt động
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">
                          {selectedGroup ? "Nhóm chat" : "Ngoại tuyến"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 relative">
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

                  {!selectedGroup && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu((prev) => !prev);
                        }}
                        className="p-2.5 rounded-full hover:bg-white/5 text-slate-400 text-xl"
                      >
                        ⋮
                      </button>

                      {showMenu && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 top-12 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                        >
                          <button
                            onClick={async () => {
                              try {
                                if (blockStatus.blockedByMe) {
                                  await unblockUserApi(selectedUser.id);
                                } else {
                                  await blockUserApi(selectedUser.id);
                                }

                                const res = await getBlockStatusApi(selectedUser.id);

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

                          <div className="h-px bg-slate-700" />

                          <button
                            onClick={handleDeleteConversation}
                            className="w-full text-left px-4 py-3 hover:bg-red-500/10 text-red-400 transition"
                          >
                            🗑️ Xoá hội thoại
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </header>

              <div className="flex-1 relative overflow-hidden">
                <ChatBox
                  messages={messages}
                  messagesEndRef={messagesEndRef}
                  currentUserId={currentUserId}
                  setMessages={setMessages}
                  onForwardMessage={handleForwardClick}
                />
              </div>

              <div className="p-4 bg-transparent">
                {selectedGroup ? (
                  <ChatInput
                    input={input}
                    setInput={setInput}
                    onSend={handleSendMessage}
                    onSendFile={handleSendFile}
                  />
                ) : blockStatus.blockedByMe ? (
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

        {activeTab !== "chat" && activeTab !== "group" && (
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
            friends={[]}
            onCreated={(group) => {
              handleSelectGroup(group);
              setShowMenu(false);
            }}
          />
        )}
      </main>

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