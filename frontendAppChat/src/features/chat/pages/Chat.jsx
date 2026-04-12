import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import ChatBox from "../components/chatBox";
import ChatInput from "../components/ChatInput";

import FriendsList from "../../friend/components/FriendsList";
import FriendRequests from "../../friend/components/FriendRequests";
import FriendSearch from "../../friend/components/FriendSearch";

import useChat from "../hooks/useChat";
import useUser from "../hooks/useUser";

import ProfileModal from "../../user/components/ProfileModal";
import ChangePasswordModal from "../../user/components/ChangePasswordModal";

import {
  connectSocket,
  joinRoom,
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

  // ================= SOCKET CONNECT =================
  useEffect(() => {
    if (!user?.id) return;

    // connect socket
    connectSocket(user.id, () => {
      console.log("✅ SOCKET READY");
    });

    // subscribe online status
    const unsubscribe = subscribeUserStatus((data) => {
      console.log("👤 STATUS:", data);

      setOnlineUsers((prev) => {
        const newSet = new Set(prev);

        if (data.status === "ONLINE") {
          newSet.add(String(data.userId));
        } else {
          newSet.delete(String(data.userId));
        }

        return newSet;
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, [user?.id]);

  // ================= CURRENT USER =================
  const currentUserId = useMemo(() => user?.id || user?._id, [user]);

  // ================= ROOM ID =================
  const roomId = useMemo(() => {
    if (!currentUserId || !selectedUser?.id) return null;

    return [Number(currentUserId), Number(selectedUser.id)]
      .sort((a, b) => a - b)
      .join("_");
  }, [currentUserId, selectedUser]);

  // ================= LOAD HISTORY =================
  useEffect(() => {
    if (!roomId) return;

    const loadHistory = async () => {
      try {
        const res = await getMessagesApi(roomId);

        const history = res.data.map((msg) => ({
          id: msg.id,
          senderId: msg.senderId,
          receiverId: msg.receiverId,
          content: msg.content,
          createdAt: msg.createdAt,
        }));

        setMessages(history);
      } catch (err) {
        console.error("Load history lỗi:", err);
      }
    };

    setMessages([]);
    loadHistory();
  }, [roomId]);

  // ================= RECEIVE MESSAGE =================
  const handleMessage = useCallback(
    (message) => {
      if (!message || message.roomId !== roomId) return;

      addMessage({
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        createdAt: message.createdAt,
      });
    },
    [roomId, addMessage]
  );

  // ================= JOIN ROOM =================
  useEffect(() => {
    if (!roomId || !currentUserId) return;

    const subscription = joinRoom(roomId, handleMessage);

    return () => {
      subscription?.unsubscribe?.();
    };
  }, [roomId, currentUserId, handleMessage]);

  // ================= SEND MESSAGE =================
  const handleSendMessage = () => {
    if (!input?.trim()) return;
    if (!currentUserId || !selectedUser?.id) return;

    const msg = {
      senderId: Number(currentUserId),
      receiverId: Number(selectedUser.id),
      roomId,
      content: input,
      type: "TEXT",
    };

    sendMessageSocket(msg);

    addMessage({
      ...msg,
      createdAt: new Date().toISOString(),
    });

    setInput("");
  };

  // ================= SELECT USER =================
  const handleSelectUser = (u) => {
    setSelectedUser({
      id: u.friendId || u.userId || u.id,
      username: u.username,
      avatar: u.avatar,
    });

    setActiveTab("chat");
  };

  // ================= LOGOUT =================
  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <div className="w-screen h-screen flex bg-slate-900">
      {/* SIDEBAR */}
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

      {/* MAIN */}
      <div className="flex-1 flex flex-col">
        {/* CHAT TAB */}
        {activeTab === "chat" && (
          <>
            {!selectedUser ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                Chọn bạn để chat 💬
              </div>
            ) : (
              <>
                <div className="p-3 text-white border-b border-slate-700">
                  Chat với: {selectedUser.username}
                </div>

                <ChatBox
                  messages={messages}
                  messagesEndRef={messagesEndRef}
                  currentUserId={currentUserId}
                />

                <ChatInput
                  input={input}
                  setInput={setInput}
                  onSend={handleSendMessage}
                />
              </>
            )}
          </>
        )}

        {/* FRIENDS */}
        {activeTab === "friends" && (
          <FriendsList
            onSelectUser={handleSelectUser}
            onlineUsers={onlineUsers}
          />
        )}

        {/* REQUESTS */}
        {activeTab === "requests" && <FriendRequests />}

        {/* SEARCH */}
        {activeTab === "search" && (
          <FriendSearch onSelectUser={handleSelectUser} />
        )}
      </div>

      {/* MODALS */}
      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          refreshUser={fetchUser}
        />
      )}

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </div>
  );
}

export default ChatPage;
