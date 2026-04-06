import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProfileModal from "../../user/components/ProfileModal";
import ChangePasswordModal from "../../user/components/ChangePasswordModal";
import { getMeApi } from "../../user/api/userApi";
function ChatPage() {
  const navigate = useNavigate();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [messages, setMessages] = useState([
    {
      text: "console.log('server running localhost http://localhost:3000/')",
      sender: "me",
      time: "08:40",
    },
    {
      text: "Giao diện này nhìn ổn chưa bạn?",
      sender: "other",
      time: "08:42",
    },
  ]);

  

  const [input, setInput] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [user, setUser] = useState(null);

  const messagesEndRef = useRef();

  const chats = [
    {
      name: "Lê Nhật Dương",
      message: "G01.899.910-260330-0439",
      time: "3 ngày",
      avatar: "https://i.pravatar.cc/40?img=1",
    },
    {
      name: "Cụ Trọng",
      message: "Bạn: Coa đi rủ Dương đi luôn",
      time: "3 ngày",
      avatar: "https://i.pravatar.cc/40?img=2",
    },
  ];

  const handleLogout = () => {
    sessionStorage.removeItem("token"); // 🔥 sửa ở đây
    sessionStorage.removeItem("role");
    navigate("/login", { replace: true });
  };
  const handleSend = () => {
    if (!input.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        text: input,
        sender: "me",
        time: new Date().toLocaleTimeString().slice(0, 5),
      },
    ]);

    setInput("");
  };

  const fetchUser = async () => {
    try {
        const res = await getMeApi();
        setUser(res.data);
    } catch (err) {
        console.log(err);
    }
};

useEffect(() => {
  const load = async () => {
    await fetchUser();
  };
  load();
}, []);

  return (
    <div style={styles.container}>
      {/* 1. LEFT NAV (THANH ĐIỀU HƯỚNG TRÁI) */}
      <div style={styles.sideNav}>
        <div style={styles.profileAvatar} onClick={() => setShowProfile(true)}>
          <img
            src={
              user?.avatar
                ? user.avatar.startsWith("http")
                  ? user.avatar
                  : `http://localhost:8080${user.avatar}`
                : "https://i.pravatar.cc/40"
            }
            style={styles.avatarImg}
            alt="Profile"
          />
        </div>

        <div
          style={{
            ...styles.navIcon,
            backgroundColor: "#005ae0",
            borderRadius: "12px",
          }}
        >
          💬
        </div>
        <div style={styles.navIcon}>👤</div>
        <div style={styles.navIcon}>📅</div>

        <div style={{ marginTop: "auto", position: "relative" }}>
          {/* Nút Bánh Răng */}
          <div
            style={styles.navIcon}
            onClick={() => setShowSettings(!showSettings)}
          >
            ⚙️
          </div>

          {/* Menu lựa chọn khi click Bánh Răng */}
          {showSettings && (
            <div style={styles.settingsMenu}>
              <div
                style={styles.menuItem}
                onClick={() => setShowChangePassword(true)}
              >
                🔑 Đổi mật khẩu
              </div>
              <div
                style={{ ...styles.menuItem, color: "#ff4d4f" }}
                onClick={handleLogout}
              >
                🚪 Đăng xuất
              </div>
            </div>
          )}

          {showChangePassword && (
            <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
          )}
        </div>
      </div>

      {/* 2. CHAT LIST (DANH SÁCH ĐOẠN HỘI THOẠI) */}
      <div style={styles.sidebar}>
        <div style={styles.searchContainer}>
          <div style={styles.searchWrapper}>
            <input placeholder="Tìm kiếm trên ChatApp" style={styles.search} />
          </div>
          <div style={styles.addFriendBtn}>+</div>
        </div>

        <div style={styles.chatListScroll}>
          {chats.map((chat, index) => (
            <div key={index} style={styles.chatItem}>
              <img src={chat.avatar} style={styles.chatAvatar} alt="" />
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={styles.chatHeaderRow}>
                  <span style={styles.userName}>{chat.name}</span>
                  <span style={styles.time}>{chat.time}</span>
                </div>
                <div style={styles.preview}>{chat.message}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. CHAT BOX (KHÔNG GIAN CHAT CHÍNH) */}
      <div style={styles.chatBox}>
        <div style={styles.chatHeader}>
          <div style={styles.headerTitle}>My Documents</div>
        </div>

        <div style={styles.messagesArea}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.sender === "me" ? "flex-end" : "flex-start",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  ...styles.messageBubble,
                  background: msg.sender === "me" ? "#005ae0" : "#3e4042",
                }}
              >
                {msg.text}
                <div style={styles.msgTime}>{msg.time}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT SECTION */}
        <div style={styles.inputSection}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={styles.textArea}
            placeholder="Nhập tin nhắn..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button onClick={handleSend} style={styles.sendBtn}>
            Gửi
          </button>
        </div>
      </div>

      {/* PROFILE MODAL */}
      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          refreshUser={fetchUser} // 🔥 thêm dòng này
        />
      )}
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    backgroundColor: "#1e1e1e",
    color: "#fff",
    overflow: "hidden",
    margin: 0,
    padding: 0,
  },

  // LEFT NAVIGATION
  sideNav: {
    width: 70,
    background: "#001529",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px 0",
  },
  profileAvatar: { cursor: "pointer", marginBottom: 20 },
  avatarImg: {
    width: 45,
    height: 45,
    borderRadius: "50%",
    border: "2px solid #005ae0",
  },
  navIcon: {
    width: 45,
    height: 45,
    margin: "8px 0",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    transition: "0.2s",
  },

  // SETTINGS POPUP MENU
  settingsMenu: {
    position: "absolute",
    bottom: "60px",
    left: "15px",
    background: "#2a2a2a",
    borderRadius: "12px",
    width: "160px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    padding: "8px",
    zIndex: 999,
    border: "1px solid #444",
  },
  menuItem: {
    padding: "12px 15px",
    fontSize: "14px",
    cursor: "pointer",
    borderRadius: "8px",
    transition: "0.2s",
    ":hover": { backgroundColor: "#3e4042" },
  },

  // SIDEBAR (CHAT LIST)
  sidebar: {
    width: 320,
    background: "#262626",
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #333",
  },
  searchContainer: {
    padding: "15px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  searchWrapper: { flex: 1 },
  search: {
    width: "100%",
    padding: "10px 15px",
    borderRadius: "10px",
    border: "none",
    background: "#3e4042",
    color: "#fff",
    outline: "none",
  },
  addFriendBtn: {
    width: 35,
    height: 35,
    background: "#3e4042",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "20px",
  },

  chatListScroll: { flex: 1, overflowY: "auto" },
  chatItem: {
    display: "flex",
    padding: "15px",
    cursor: "pointer",
    transition: "0.2s",
    borderBottom: "1px solid #2d2d2d",
  },
  chatAvatar: { width: 48, height: 48, borderRadius: "50%", marginRight: 12 },
  chatHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  userName: { fontWeight: "bold", fontSize: "15px" },
  time: { fontSize: "11px", color: "#888" },
  preview: {
    fontSize: "13px",
    color: "#aaa",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  // MAIN CHAT AREA
  chatBox: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    background: "#1e1e1e",
  },
  chatHeader: {
    height: "65px",
    padding: "0 20px",
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid #333",
    background: "#1e1e1e",
  },
  headerTitle: { fontSize: "17px", fontWeight: "bold" },

  messagesArea: {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
  messageBubble: {
    padding: "10px 16px",
    borderRadius: "18px",
    maxWidth: "65%",
    fontSize: "15px",
    lineHeight: "1.4",
    wordBreak: "break-word",
  },
  msgTime: {
    fontSize: "10px",
    textAlign: "right",
    marginTop: "4px",
    opacity: 0.6,
  },

  inputSection: {
    padding: "15px 20px",
    display: "flex",
    alignItems: "flex-end",
    gap: "12px",
    borderTop: "1px solid #333",
  },
  textArea: {
    flex: 1,
    height: "45px",
    maxHeight: "120px",
    padding: "12px 18px",
    borderRadius: "22px",
    border: "none",
    background: "#2a2a2a",
    color: "#fff",
    outline: "none",
    resize: "none",
    fontSize: "15px",
  },
  sendBtn: {
    background: "#005ae0",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "20px",
    fontWeight: "bold",
    cursor: "pointer",
    height: "45px",
  },
};

export default ChatPage;
