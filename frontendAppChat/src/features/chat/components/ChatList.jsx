function ChatList({ groups, onSelectGroup }) {
  return (
    <div className="w-[260px] bg-slate-900 border-r border-slate-800 p-3">
      <h3 className="text-white mb-3 font-semibold">Nhóm chat</h3>

      {groups.length === 0 ? (
        <div className="text-slate-500 text-sm">Chưa có nhóm</div>
      ) : (
        groups.map((group) => (
          <div
            key={group.id}
            onClick={() => onSelectGroup(group)}
            className="p-3 rounded-lg hover:bg-slate-800 cursor-pointer text-white"
          >
            {group.name}
          </div>
        ))
      )}
    </div>
  );
}
export default ChatList;