import {
  MessageCircle,
  User,
  Calendar,
  Settings,
  LogOut,
  Key,
} from "lucide-react";

function Sidebar({
  user,
  showSettings,
  setShowSettings,
  onLogout,
  onOpenProfile,
  onChangePassword,
}) {
  return (
    <div className="w-[75px] bg-[#001529] flex flex-col items-center py-6 shrink-0 h-full border-r border-white/5">
      {/* PROFILE AVATAR */}
      <div
        className="relative group cursor-pointer mb-8"
        onClick={onOpenProfile}
      >
        <img
          src={
            user?.avatar
              ? user.avatar.startsWith("http")
                ? user.avatar
                : `http://localhost:8080${user.avatar}`
              : "https://i.pravatar.cc/40"
          }
          className="w-12 h-12 rounded-full border-2 border-transparent group-hover:border-[#005ae0] object-cover transition-all duration-300 shadow-lg"
          alt="Avatar"
        />
        {/* Status indicator (online) */}
        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#001529] rounded-full"></div>
      </div>

      {/* NAVIGATION ICONS */}
      <div className="flex flex-col space-y-4 w-full items-center">
        {/* Active Item */}
        <div className="relative w-full flex justify-center">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#005ae0] rounded-r-full"></div>
          <div className="p-3 bg-[#005ae0]/15 text-[#005ae0] rounded-2xl cursor-pointer shadow-[0_0_15px_rgba(0,90,224,0.3)]">
            <MessageCircle size={26} strokeWidth={2.5} />
          </div>
        </div>

        {/* Other Items */}
        <div className="p-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-2xl cursor-pointer transition-all">
          <User size={24} />
        </div>
        <div className="p-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-2xl cursor-pointer transition-all">
          <Calendar size={24} />
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="mt-auto relative pb-4">
        <div
          className={`p-3 rounded-2xl cursor-pointer transition-all duration-300 ${
            showSettings
              ? "bg-white/10 text-white rotate-90"
              : "text-gray-500 hover:text-white"
          }`}
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings size={24} />
        </div>

        {/* SETTINGS DROPDOWN (Neumorphism Dark Style) */}
        {showSettings && (
          <div className="absolute bottom-16 left-4 w-56 bg-[#1a1d21] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] border border-white/10 overflow-hidden animate-in fade-in zoom-in duration-200 z-[100]">
            <div className="p-2 space-y-1">
              <button
                onClick={() => {
                  onChangePassword();
                  setShowSettings(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-[#005ae0] hover:text-white transition-all text-sm font-medium"
              >
                <div className="p-1.5 bg-white/5 rounded-lg group-hover:bg-white/20">
                  <Key size={16} />
                </div>
                Đổi mật khẩu
              </button>

              <div className="h-[1px] bg-white/5 my-1 mx-2"></div>

              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
              >
                <div className="p-1.5 bg-red-500/10 rounded-lg">
                  <LogOut size={16} />
                </div>
                Đăng xuất
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;
