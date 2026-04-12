function ChatBox({ messages, messagesEndRef, currentUserId }) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.4);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(148, 163, 184, 0.6);
          }
        `}
      </style>

      {messages.map((msg, index) => {
        const isMe = String(msg.senderId) === String(currentUserId);

        return (
          <div
            key={msg.id || msg._id || index}
            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[65%] px-5 py-3 rounded-3xl ${
                isMe ? "bg-indigo-600 text-white" : "bg-slate-700 text-white"
              }`}
            >
              <p>{msg.content || msg.text}</p>
            </div>
          </div>
        );
      })}

      <div ref={messagesEndRef} />
    </div>
  );
}

export default ChatBox;
