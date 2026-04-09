function ChatBox({ messages, messagesEndRef }) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex ${
            msg.sender === "me" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`max-w-[70%] px-4 py-2.5 rounded-2xl shadow-sm ${
              msg.sender === "me"
                ? "bg-[#005ae0] text-white rounded-tr-none"
                : "bg-[#3e4042] text-gray-100 rounded-tl-none"
            }`}
          >
            <p className="text-[15px] leading-relaxed break-words">
              {msg.text}
            </p>
            <span className="block text-[10px] mt-1 text-right opacity-60">
              {msg.time}
            </span>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
export default ChatBox