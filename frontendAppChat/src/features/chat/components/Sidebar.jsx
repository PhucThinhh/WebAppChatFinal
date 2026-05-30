import {
  MessageCircle,
  User,
  Calendar,
  Settings,
  LogOut,
  Key,
  Search,
  Users,
  Bell,
} from "lucide-react";
import { getImageUrl } from "../../../utils/imageUrl";

const DEFAULT_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="%231e293b"/><circle cx="32" cy="24" r="12" fill="%23e2e8f0"/><path d="M12 56c4-12 14-18 20-18s16 6 20 18" fill="%23e2e8f0"/></svg>';

function Sidebar({
  user,
  showSettings,
  setShowSettings,
  onLogout,
  onOpenProfile,
  onChangePassword,
  onSelectTab,
  activeTab,
  notificationCount = 0,
}) {
  const avatarSrc = getImageUrl(user?.avatar) || DEFAULT_AVATAR;

  const navItems = [
    {
      id: "chat",
      icon: MessageCircle,
      label: "Tin nhắn",
      badge: null,
    },
    {
      id: "friends",
      icon: User,
      label: "Bạn bè",
      badge: null,
    },
    {
      id: "requests",
      icon: Calendar,
      label: "Lời mời",
      badge: null,
    },
    {
      id: "group",
      icon: Users,
      label: "Nhóm",
      badge: null,
    },
    {
      id: "search",
      icon: Search,
      label: "Tìm kiếm",
      badge: null,
    },
  ];

  return (
    <aside className="zalo-sidebar">
      <button
        type="button"
        className="zalo-avatar-wrap"
        onClick={onOpenProfile}
        title={user?.username || "Trang cá nhân"}
      >
        <img
          src={avatarSrc}
          className="zalo-avatar"
          alt="avatar"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_AVATAR;
          }}
        />
        <span className="zalo-online-dot" />
      </button>

      <nav className="zalo-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`zalo-nav-btn ${isActive ? "active" : ""}`}
              title={item.label}
            >
              <Icon size={24} strokeWidth={2.2} />
              {item.badge && <span className="zalo-nav-badge">{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      <div className="zalo-bottom">
        <button
          type="button"
          className={`zalo-nav-btn ${activeTab === "notifications" ? "active" : ""}`}
          title="Thông báo"
          onClick={() => onSelectTab("notifications")}
        >
          <Bell size={23} strokeWidth={2.2} />
          {notificationCount > 0 && (
            <span className="zalo-nav-badge">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </button>

        <div className="relative">
          <button
            type="button"
            className={`zalo-nav-btn ${showSettings ? "active" : ""}`}
            onClick={() => setShowSettings(!showSettings)}
            title="Cài đặt"
          >
            <Settings size={23} strokeWidth={2.2} />
          </button>

          {showSettings && (
            <div className="zalo-settings-menu">
              <div className="zalo-settings-header">
                <img
                  src={avatarSrc}
                  alt="avatar"
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_AVATAR;
                  }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.username || "Người dùng"}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {user?.email || "Tài khoản ChatApp"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onChangePassword}
                className="zalo-settings-item"
              >
                <Key size={17} />
                <span>Đổi mật khẩu</span>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="zalo-settings-item danger"
              >
                <LogOut size={17} />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
