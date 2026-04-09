import { Send } from "lucide-react";

function ChatInput({ input, setInput, onSend }) {
  return (
    <div className="p-4 border-t border-gray-800">
      <div className="flex items-end gap-3 max-w-4xl mx-auto">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập tin nhắn..."
          rows="1"
          className="flex-1 bg-[#2a2a2a] text-white px-5 py-3 rounded-2xl outline-none focus:ring-1 focus:ring-[#005ae0] resize-none text-[15px] max-h-32"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <button
          onClick={onSend}
          className="bg-[#005ae0] p-3 rounded-full hover:bg-[#004bbd] transition-all active:scale-95 text-white"
        >
          <Send size={22} />
        </button>
      </div>
    </div>
  );
}
export default ChatInput