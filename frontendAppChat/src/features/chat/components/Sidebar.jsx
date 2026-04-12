import {
  MessageCircle,
  User,
  Calendar,
  Settings,
  LogOut,
  Key,
  Search,
} from "lucide-react";

function Sidebar({
  user,
  showSettings,
  setShowSettings,
  onLogout,
  onOpenProfile,
  onChangePassword,
  onSelectTab,
  activeTab,
}) {
  return (
    <div className="w-[90px] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center py-6 shrink-0 h-screen border-r border-slate-700/50">
      {/* AVATAR */}
      <div className="relative mb-10 cursor-pointer" onClick={onOpenProfile}>
        <img
          src={
            user?.avatar?.startsWith("http")
              ? user.avatar
              : `http://localhost:8080${user?.avatar}`
          }
          className="w-14 h-14 rounded-full object-cover border border-slate-600"
          alt="avatar"
        />
      </div>

      {/* NAV */}
      <div className="flex flex-col space-y-5 flex-1 items-center">
        {/* CHAT */}
        <div
          onClick={() => onSelectTab("chat")}
          className={`p-3 rounded-2xl cursor-pointer transition ${
            activeTab === "chat"
              ? "bg-blue-500/20 text-blue-400"
              : "text-slate-500 hover:text-white"
          }`}
        >
          <MessageCircle size={24} />
        </div>

        {/* FRIENDS */}
        <div
          onClick={() => onSelectTab("friends")}
          className={`p-3 rounded-2xl cursor-pointer transition ${
            activeTab === "friends"
              ? "bg-blue-500/20 text-blue-400"
              : "text-slate-500 hover:text-white"
          }`}
        >
          <User size={24} />
        </div>

        {/* REQUESTS */}
        <div
          onClick={() => onSelectTab("requests")}
          className={`p-3 rounded-2xl cursor-pointer transition ${
            activeTab === "requests"
              ? "bg-blue-500/20 text-blue-400"
              : "text-slate-500 hover:text-white"
          }`}
        >
          <Calendar size={24} />
        </div>

        {/* SEARCH FRIENDS 🔥 NEW */}
        <div
          onClick={() => onSelectTab("search")}
          className={`p-3 rounded-2xl cursor-pointer transition ${
            activeTab === "search"
              ? "bg-blue-500/20 text-blue-400"
              : "text-slate-500 hover:text-white"
          }`}
        >
          <Search size={24} />
        </div>
      </div>

      {/* SETTINGS */}
      <div className="relative">
        <div
          className="p-3 text-slate-500 hover:text-white cursor-pointer"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings size={24} />
        </div>

        {showSettings && (
          <div className="absolute bottom-16 left-0 bg-slate-800 p-2 rounded-xl w-52 shadow-lg border border-slate-700">
            {/* CHANGE PASSWORD */}
            <button
              onClick={onChangePassword}
              className="flex items-center gap-2 p-2 text-white w-full hover:bg-slate-700 rounded"
            >
              <Key size={16} /> Đổi mật khẩu
            </button>

            {/* LOGOUT */}
            <button
              onClick={onLogout}
              className="flex items-center gap-2 p-2 text-red-400 w-full hover:bg-slate-700 rounded"
            >
              <LogOut size={16} /> Đăng xuất
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
