import { Send, Paperclip, Smile } from "lucide-react";
import { useRef, useEffect } from "react";

function ChatInput({ input, setInput, onSend }) {
  const textareaRef = useRef(null);

  // AUTO RESIZE TEXTAREA
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  // SEND MESSAGE
  const handleSend = () => {
    if (!input?.trim()) return;

    onSend(input.trim()); // gửi lên ChatPage
    setInput(""); // clear input ngay cho chắc
  };

  return (
    <div className="px-6 py-5 border-t border-slate-700/50">
      <div className="flex items-end gap-3 max-w-5xl mx-auto">
        {/* ATTACH */}
        <button className="p-3 rounded-full hover:bg-slate-700 transition">
          <Paperclip size={22} />
        </button>

        {/* INPUT */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập tin nhắn..."
          rows="1"
          className="flex-1 bg-slate-800 text-white px-5 py-3 rounded-3xl outline-none resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        {/* EMOJI */}
        <button className="p-3 rounded-full hover:bg-slate-700 transition">
          <Smile size={22} />
        </button>

        {/* SEND */}
        <button
          onClick={handleSend}
          disabled={!input?.trim()}
          className="p-3 rounded-full hover:bg-indigo-600 disabled:opacity-40 transition"
        >
          <Send size={22} />
        </button>
      </div>
    </div>
  );
}

export default ChatInput;
