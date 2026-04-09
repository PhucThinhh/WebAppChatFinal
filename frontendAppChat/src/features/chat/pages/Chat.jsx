import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import ChatBox from "../components/chatBox";
import ChatInput from "../components/ChatInput";
import useChat from "../hooks/useChat";
import useUser from "../hooks/useUser";
import ProfileModal from "../../user/components/ProfileModal";
import ChangePasswordModal from "../../user/components/ChangePasswordModal";

function ChatPage() {
  const navigate = useNavigate();

  const { messages, input, setInput, sendMessage, messagesEndRef } = useChat();
  const { user, fetchUser } = useUser();

  const [showProfile, setShowProfile] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <div className="w-full h-screen bg-[#0f0f0f] flex items-center justify-center p-6">
      <div className="w-full h-full flex bg-[#1e1e1e] text-white rounded-2xl overflow-hidden">
        <Sidebar
          user={user}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          onLogout={handleLogout}
          onOpenProfile={() => setShowProfile(true)}
          onChangePassword={() => setShowChangePassword(true)}
        />

        <div className="flex-1 flex flex-col">
          <ChatBox messages={messages} messagesEndRef={messagesEndRef} />

          <ChatInput input={input} setInput={setInput} onSend={sendMessage} />
        </div>

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
    </div>
  );
}

export default ChatPage;