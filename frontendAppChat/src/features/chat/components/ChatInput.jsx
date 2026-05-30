import {
  Send,
  Paperclip,
  Smile,
  Sparkles,
  Image,
  X,
  Loader2,
} from "lucide-react";
import { useRef, useEffect, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import { rewriteMessageApi, uploadFileApi } from "../api/chatApi";

function ChatInput({ input, setInput, onSend, onSendFile }) {
  const textareaRef = useRef(null);
  const fileRef = useRef(null);

  const [showEmoji, setShowEmoji] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    if (!textareaRef.current) return;

    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height =
      Math.min(textareaRef.current.scrollHeight, 140) + "px";
  }, [input]);

  const handleSend = () => {
    if (!input?.trim()) return;

    if (aiMode) {
      handleAiRewrite();
      return;
    }

    onSend(input.trim());
    setInput("");
    setShowEmoji(false);
    setAiSuggestions([]);
    setAiError("");
  };

  const handleAiRewrite = async () => {
    const text = input?.trim();
    if (!text || aiLoading) return;

    try {
      setAiLoading(true);
      setAiError("");
      const res = await rewriteMessageApi(text);
      const suggestions = Array.isArray(res.data) ? res.data : [];
      setAiSuggestions(suggestions.filter(Boolean));
    } catch (err) {
      console.log("AI rewrite error:", err);
      setAiSuggestions([]);
      setAiError("AI chưa gợi ý được, thử lại sau nha.");
    } finally {
      setAiLoading(false);
    }
  };

  const chooseAiSuggestion = (suggestion) => {
    setInput(suggestion);
    setAiSuggestions([]);
    setAiError("");
    setAiMode(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const handleEmojiClick = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji);
  };

  const handleSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    setPreviewFile({
      file,
      url,
      isImage: file.type.startsWith("image"),
    });

    e.target.value = "";
  };

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
    <div className="zalo-input-area">
      {(aiSuggestions.length > 0 || aiError || aiLoading) && (
        <div className="ai-suggestions-panel">
          <div className="ai-suggestions-head">
            <span>Gợi ý câu nhắn</span>
            <button
              type="button"
              onClick={() => {
                setAiSuggestions([]);
                setAiError("");
              }}
              title="Đóng gợi ý"
            >
              <X size={15} />
            </button>
          </div>

          {aiLoading && (
            <div className="ai-suggestions-loading">
              <Loader2 size={16} className="animate-spin" />
              AI đang viết lại câu cho tự nhiên hơn...
            </div>
          )}

          {aiError && <div className="ai-suggestions-error">{aiError}</div>}

          {aiSuggestions.map((suggestion, index) => (
            <button
              type="button"
              key={`${suggestion}-${index}`}
              className="ai-suggestion-item"
              onClick={() => chooseAiSuggestion(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {previewFile && (
        <div className="zalo-file-preview">
          {previewFile.isImage ? (
            <img
              src={previewFile.url}
              className="zalo-file-preview-img"
              alt="preview"
            />
          ) : (
            <div className="zalo-file-preview-doc">
              <Paperclip size={18} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {previewFile.file.name}
                </p>
                <p className="text-xs text-slate-400">
                  {(previewFile.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setPreviewFile(null)}
            className="zalo-file-remove"
          >
            <X size={15} />
          </button>
        </div>
      )}

      <div className="zalo-input-shell">
        <input type="file" ref={fileRef} hidden onChange={handleSelectFile} />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="zalo-input-icon"
          title="Gửi file"
        >
          <Paperclip size={22} />
        </button>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="zalo-input-icon"
          title="Gửi ảnh"
        >
          <Image size={22} />
        </button>

        <button
          type="button"
          onClick={() => setAiMode((v) => !v)}
          title={aiMode ? "Tắt gợi ý AI" : "Gợi ý câu bằng AI"}
          className={`zalo-input-icon ${aiMode ? "ai-active" : ""}`}
        >
          <Sparkles size={22} />
        </button>

        <div className="zalo-textbox-wrap">
          {aiMode && <span className="zalo-ai-chip">AI</span>}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setAiError("");
            }}
            placeholder={
              aiMode
                ? "Nhập ý muốn nói, AI sẽ gợi ý câu hay hơn..."
                : "Nhập tin nhắn, @ để nhắc tên..."
            }
            rows="1"
            className="zalo-textbox"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                previewFile ? handleUploadFile() : handleSend();
              }
            }}
          />
        </div>

        <button
          type="button"
          onClick={() => setShowEmoji((prev) => !prev)}
          className="zalo-input-icon"
          title="Emoji"
        >
          <Smile size={22} />
        </button>

        <button
          type="button"
          onClick={previewFile ? handleUploadFile : handleSend}
          disabled={loading || aiLoading || (!previewFile && !input?.trim())}
          className="zalo-send-btn"
          title={aiMode ? "Lấy gợi ý AI" : "Gửi"}
        >
          {loading || aiLoading ? (
            <Loader2 size={21} className="animate-spin" />
          ) : (
            <Send size={21} />
          )}
        </button>
      </div>

      {showEmoji && (
        <div className="zalo-emoji-panel">
          <EmojiPicker onEmojiClick={handleEmojiClick} theme="light" />
        </div>
      )}
    </div>
  );
}

export default ChatInput;
