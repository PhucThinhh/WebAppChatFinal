import { Send, Paperclip, Smile, Sparkles } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { uploadFileApi } from "../api/chatApi";

function ChatInput({ input, setInput, onSend, onSendFile }) {
  const textareaRef = useRef(null);
  const fileRef = useRef(null);

  const [showEmoji, setShowEmoji] = useState(false);

  // 🔥 NEW STATE
  const [previewFile, setPreviewFile] = useState(null);
  const [loading, setLoading] = useState(false);
  /** Gửi tin tự thêm tiền tố /ai (ChatService) */
  const [aiMode, setAiMode] = useState(false);

  // AUTO RESIZE
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [input]);

  // SEND TEXT
  const handleSend = () => {
    if (!input?.trim()) return;

    let text = input.trim();
    if (aiMode && !text.startsWith("/ai")) {
      text = `/ai ${text}`;
    }

    onSend(text);
    setInput("");
    setShowEmoji(false);
  };

  // EMOJI
  const handleEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji);
  };

  // 🔥 CHỌN FILE → PREVIEW
  const handleSelectFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    setPreviewFile({
      file,
      url,
      isImage: file.type.startsWith("image"),
    });
  };

  // 🔥 UPLOAD FILE
  const handleUploadFile = async () => {
    if (!previewFile) return;

    try {
      setLoading(true);

      const res = await uploadFileApi(previewFile.file);

      onSendFile(res.data);

      setPreviewFile(null);
    } catch (err) {
      console.log("Upload lỗi:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 py-5 border-t border-slate-700/50 relative">
      {/* 🔥 PREVIEW */}
      {previewFile && (
        <div className="mb-3 relative w-fit">
          {previewFile.isImage ? (
            <img src={previewFile.url} className="w-32 rounded-lg border" />
          ) : (
            <div className="bg-slate-800 px-3 py-2 rounded-lg">
              📎 {previewFile.file.name}
            </div>
          )}

          <button
            onClick={() => setPreviewFile(null)}
            className="absolute -top-2 -right-2 bg-black text-white text-xs px-2 rounded"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-end gap-3 max-w-5xl mx-auto">
        {/* FILE INPUT */}
        <input type="file" ref={fileRef} hidden onChange={handleSelectFile} />

        {/* ATTACH */}
        <button
          onClick={() => fileRef.current.click()}
          className="p-3 rounded-full hover:bg-slate-700 transition"
        >
          <Paperclip size={22} />
        </button>

        <button
          type="button"
          onClick={() => setAiMode((v) => !v)}
          title={aiMode ? "Tắt chế độ hỏi AI" : "Bật chế độ hỏi AI (/ai)"}
          className={`p-3 rounded-full transition shrink-0 ${
            aiMode
              ? "bg-emerald-600 text-white hover:bg-emerald-500"
              : "hover:bg-slate-700 text-slate-300"
          }`}
        >
          <Sparkles size={22} />
        </button>

        {/* INPUT */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            aiMode
              ? "Câu hỏi cho AI (gửi sẽ thêm /ai)..."
              : "Nhập tin nhắn..."
          }
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
        <button
          onClick={() => setShowEmoji((prev) => !prev)}
          className="p-3 rounded-full hover:bg-slate-700 transition"
        >
          <Smile size={22} />
        </button>

        {/* SEND */}
        <button
          onClick={previewFile ? handleUploadFile : handleSend}
          className="p-3 rounded-full hover:bg-indigo-600 transition"
        >
          <Send size={22} />
        </button>
      </div>

      {/* 🔥 LOADING */}
      {loading && (
        <div className="text-xs text-slate-400 mt-2">Đang upload...</div>
      )}

      {/* EMOJI PICKER */}
      {showEmoji && (
        <div className="absolute bottom-20 right-10 z-50">
          <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
        </div>
      )}
    </div>
  );
}

export default ChatInput;
