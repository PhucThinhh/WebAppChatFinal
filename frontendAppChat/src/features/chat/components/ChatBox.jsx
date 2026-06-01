import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { deleteMessageApi, reactMessageApi, recallMessageApi } from "../api/chatApi";
import { getBackendUrl } from "../../../config/env";
import { DEFAULT_AVATAR_URL, getImageUrl } from "../../../utils/imageUrl";

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const ChatBox = memo(
  ({
    messages = [],
    setMessages,
    messagesEndRef,
    currentUserId,
    onForwardMessage,
    showSearch = false,
    onCloseSearch,
    groupMembers = [],
    isGroup = false,
  }) => {
    const [selectedMessageId, setSelectedMessageId] = useState(null);
    const [previewPdf, setPreviewPdf] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [matchIndexes, setMatchIndexes] = useState([]);
    const [activeMatchPos, setActiveMatchPos] = useState(-1);
    const messageRefs = useRef({});

    useEffect(() => {
      requestAnimationFrame(() => {
        messagesEndRef?.current?.scrollIntoView({ behavior: "smooth" });
      });
    }, [messages, messagesEndRef]);

    useEffect(() => {
      const handleClickOutside = () => setSelectedMessageId(null);
      window.addEventListener("click", handleClickOutside);
      return () => window.removeEventListener("click", handleClickOutside);
    }, []);

    useEffect(() => {
      const handleRealtimeReaction = (event) => {
        const updated = event.detail;
        if (!updated?.id && !updated?._id) return;

        setMessages((prev) =>
          prev.map((m) =>
            String(m.id || m._id) === String(updated.id || updated._id)
              ? { ...m, reactions: updated.reactions || {} }
              : m
          )
        );
      };

      window.addEventListener("chat-message-reaction", handleRealtimeReaction);
      return () => window.removeEventListener("chat-message-reaction", handleRealtimeReaction);
    }, [setMessages]);

    const visibleMessages = useMemo(() => {
      return messages.filter((msg) => {
        if (!msg.deletedBy) return true;
        return Number(msg.deletedBy) !== Number(currentUserId);
      });
    }, [messages, currentUserId]);

    const normalizedKeyword = searchKeyword.trim().toLowerCase();
    const getSearchableText = (msg) =>
      String(msg?.content || msg?.text || msg?.originalContent || "");

    const scrollToMatch = (matchPos) => {
      if (matchPos < 0 || matchPos >= matchIndexes.length) return;
      const targetMessageIndex = matchIndexes[matchPos];
      const targetMessage = visibleMessages[targetMessageIndex];
      const targetId = targetMessage?._id || targetMessage?.id;
      const node = messageRefs.current[targetId];
      node?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    };

    useEffect(() => {
      if (!showSearch) {
        setSearchKeyword("");
        setMatchIndexes([]);
        setActiveMatchPos(-1);
      }
    }, [showSearch]);

    useEffect(() => {
      if (!normalizedKeyword) {
        setMatchIndexes([]);
        setActiveMatchPos(-1);
        return;
      }

      const indexes = [];
      visibleMessages.forEach((msg, index) => {
        if (getSearchableText(msg).toLowerCase().includes(normalizedKeyword)) {
          indexes.push(index);
        }
      });

      setMatchIndexes(indexes);
      setActiveMatchPos(indexes.length ? indexes.length - 1 : -1);
    }, [normalizedKeyword, visibleMessages]);

    useEffect(() => {
      if (activeMatchPos >= 0) scrollToMatch(activeMatchPos);
    }, [activeMatchPos, matchIndexes]);

    const jumpPrev = () => {
      if (!matchIndexes.length) return;
      setActiveMatchPos((prev) => (prev <= 0 ? matchIndexes.length - 1 : prev - 1));
    };

    const jumpNext = () => {
      if (!matchIndexes.length) return;
      setActiveMatchPos((prev) => (prev >= matchIndexes.length - 1 ? 0 : prev + 1));
    };

    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const renderHighlightedText = (text) => {
      const safeText = String(text || "");
      if (!normalizedKeyword) return safeText;

      const regex = new RegExp(`(${escapeRegex(normalizedKeyword)})`, "gi");
      return safeText.split(regex).map((part, idx) => {
        const isHit = part.toLowerCase() === normalizedKeyword;
        return isHit ? (
          <mark key={idx} className="bg-yellow-200 text-slate-900 px-1 rounded">
            {part}
          </mark>
        ) : (
          <React.Fragment key={idx}>{part}</React.Fragment>
        );
      });
    };

    const handleDeleteMessage = async (id) => {
      try {
        await deleteMessageApi(id);
        setMessages((prev) =>
          prev.map((m) =>
            String(m.id || m._id) === String(id) ? { ...m, deletedBy: currentUserId } : m
          )
        );
      } catch (err) {
        console.log("Delete error:", err);
      }
    };

    const handleRecallMessage = async (id) => {
      try {
        await recallMessageApi(id);
        setMessages((prev) =>
          prev.map((m) =>
            String(m.id || m._id) === String(id) ? { ...m, isRecalled: true } : m
          )
        );
      } catch (err) {
        console.log("Recall error:", err);
      }
    };

    const handleReactMessage = async (id, emoji) => {
      try {
        const res = await reactMessageApi(id, emoji);
        const updated = res.data;

        setMessages((prev) =>
          prev.map((m) =>
            String(m.id || m._id) === String(id)
              ? { ...m, reactions: updated.reactions || {} }
              : m
          )
        );
        setSelectedMessageId(null);
      } catch (err) {
        console.log("Reaction error:", err);
      }
    };

    const renderReactions = (reactions) => {
      const entries = Object.entries(reactions || {}).filter(
        ([, users]) => Array.isArray(users) && users.length
      );

      if (!entries.length) return null;

      return (
        <div className="message-reactions">
          {entries.map(([emoji, users]) => (
            <span key={emoji} className="message-reaction-pill">
              {emoji} {users.length}
            </span>
          ))}
        </div>
      );
    };

    const getMessageStatusLabel = (msg) => {
      const seenBy = Array.isArray(msg?.seenBy) ? msg.seenBy : [];
      if (seenBy.some((id) => Number(id) !== Number(currentUserId))) {
        return "✓✓ Đã xem";
      }

      if (String(msg?.status || "").toUpperCase() === "SEEN") {
        return "✓✓ Đã xem";
      }

      if (String(msg?.status || "").toUpperCase() === "SENDING") {
        return "Đang gửi...";
      }

      return "✓ Đã gửi";
    };

    const memberById = useMemo(() => {
      return new Map(
        groupMembers
          .filter((member) => member?.userId || member?.id)
          .map((member) => [Number(member.userId || member.id), member])
      );
    }, [groupMembers]);

    const renderSeenAvatars = (msg, isMe, isSystem) => {
      if (!isGroup || !isMe || isSystem || msg.isRecalled) return null;

      const viewers = (Array.isArray(msg?.seenBy) ? msg.seenBy : [])
        .map((id) => Number(id))
        .filter((id) => id && id !== Number(currentUserId))
        .map((id) => memberById.get(id))
        .filter(Boolean)
        .slice(0, 5);

      if (!viewers.length) return null;

      return (
        <div className="message-seen-avatars">
          {viewers.map((member) => (
            <img
              key={member.userId || member.id}
              src={getImageUrl(member.avatar) || DEFAULT_AVATAR_URL}
              title={member.username}
              alt={member.username || "seen"}
              onError={(e) => {
                e.currentTarget.src = DEFAULT_AVATAR_URL;
              }}
            />
          ))}
        </div>
      );
    };

    const getFileUrl = (url) => {
      if (!url) return "";
      const normalized = String(url).trim();
      const backendUrl = getBackendUrl();
      if (normalized.startsWith("/")) return `${backendUrl}${normalized}`;
      if (normalized.includes("localhost:8080")) {
        return normalized.replace(/^https?:\/\/localhost:8080/i, backendUrl);
      }
      if (normalized.includes("127.0.0.1:8080")) {
        return normalized.replace(/^https?:\/\/127\.0\.0\.1:8080/i, backendUrl);
      }
      if (normalized.includes("localhost:5173")) {
        return normalized.replace(/^https?:\/\/localhost:5173/i, backendUrl);
      }
      if (normalized.includes("10.0.2.2:8080")) {
        return normalized.replace(/^https?:\/\/10\.0\.2\.2:8080/i, backendUrl);
      }
      return normalized;
    };

    return (
      <div className="chatbox-light">
        {showSearch && (
          <div className="message-search-bar">
            <div className="flex items-center gap-2">
              <input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm trong cuộc trò chuyện..."
                className="message-search-input"
              />
              <button onClick={jumpPrev} disabled={!matchIndexes.length} className="message-search-btn">
                ↑
              </button>
              <button onClick={jumpNext} disabled={!matchIndexes.length} className="message-search-btn">
                ↓
              </button>
              <button onClick={onCloseSearch} className="message-search-btn">
                ×
              </button>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {matchIndexes.length === 0
                ? "Không có kết quả"
                : `Kết quả: ${activeMatchPos + 1}/${matchIndexes.length}`}
            </div>
          </div>
        )}

        {visibleMessages.length === 0 ? (
          <div className="chatbox-empty">Bắt đầu cuộc trò chuyện...</div>
        ) : (
          visibleMessages.map((msg) => {
            const senderId = msg.senderId || msg.sender?._id || msg.sender || msg.userId;
            const isMe = Number(senderId) === Number(currentUserId);
            const isBot = Number(senderId) === 0;
            const messageType = String(msg?.type || "").toUpperCase();
            const isViolation = messageType === "VIOLATION";
            const isSystem = messageType === "SYSTEM" || isViolation;
            const messageId = msg._id || msg.id;

            return (
              <div
                key={messageId}
                ref={(node) => {
                  if (node) messageRefs.current[messageId] = node;
                }}
                className={`message-row ${isSystem || isBot ? "center" : isMe ? "me" : "other"}`}
              >
                <div className={`message-stack ${isSystem || isBot ? "center" : isMe ? "me" : "other"}`}>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isSystem) setSelectedMessageId(messageId);
                    }}
                    className="relative"
                  >
                    <div className={`message-bubble ${isViolation ? "violation" : isSystem ? "system" : isBot ? "bot" : isMe ? "me" : "other"}`}>
                      {isBot && !isSystem && <div className="bot-label">Trợ lý AI</div>}

                      {msg.isRecalled ? (
                        <p className="italic text-slate-400">
                          {isMe ? "Bạn đã thu hồi tin nhắn" : "Tin nhắn đã được thu hồi"}
                        </p>
                      ) : msg.type === "FILE" ? (
                        msg.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img src={getFileUrl(msg.fileUrl)} alt="file" className="message-image" />
                        ) : msg.fileUrl?.endsWith(".pdf") ? (
                          <button onClick={() => setPreviewPdf(getFileUrl(msg.fileUrl))} className="file-card">
                            📄 {msg.fileUrl.split("/").pop()}
                          </button>
                        ) : (
                          <a href={getFileUrl(msg.fileUrl)} target="_blank" rel="noreferrer" className="file-card">
                            📎 {msg.fileUrl.split("/").pop()}
                          </a>
                        )
                      ) : msg.type === "FORWARD" ? (
                        <div className="text-sm">
                          <div className="forward-label">Chuyển tiếp</div>
                          {msg.fileUrl ? (
                            msg.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                              <img src={getFileUrl(msg.fileUrl)} className="message-image" alt="forward" />
                            ) : (
                              <a href={getFileUrl(msg.fileUrl)} target="_blank" rel="noreferrer" className="file-card">
                                📎 {msg.fileUrl.split("/").pop()}
                              </a>
                            )
                          ) : (
                            <div className="forward-card">{renderHighlightedText(msg.originalContent)}</div>
                          )}
                        </div>
                      ) : (
                        <p className="message-text">{renderHighlightedText(msg.content || msg.text)}</p>
                      )}
                    </div>

                    {!msg.isRecalled && !isSystem && renderReactions(msg.reactions)}

                    {selectedMessageId === messageId && !isSystem && (
                      <div className={`message-menu ${isMe ? "right-0" : "left-0"}`}>
                        {!msg.isRecalled && !isBot && (
                          <div className="message-reaction-picker">
                            {QUICK_REACTIONS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReactMessage(messageId, emoji);
                                }}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        )}
                        {!msg.isRecalled && !isBot && isMe && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRecallMessage(messageId);
                              setSelectedMessageId(null);
                            }}
                          >
                            Thu hồi
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMessage(messageId);
                            setSelectedMessageId(null);
                          }}
                        >
                          Xóa
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onForwardMessage(msg);
                            setSelectedMessageId(null);
                          }}
                        >
                          Chuyển tiếp
                        </button>
                      </div>
                    )}
                  </div>

                  {(msg.createdAt || msg.time) && (
                    <span className="message-time">
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : msg.time}
                    </span>
                  )}
                  {isMe && !isSystem && !msg.isRecalled && (
                    <span className={`message-status ${getMessageStatusLabel(msg).includes("Đã xem") ? "seen" : ""}`}>
                      {getMessageStatusLabel(msg)}
                    </span>
                  )}
                  {renderSeenAvatars(msg, isMe, isSystem)}
                </div>
              </div>
            );
          })
        )}

        {previewPdf && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999]">
            <div className="bg-white rounded-3xl w-[82%] h-[82%] relative shadow-2xl overflow-hidden">
              <button onClick={() => setPreviewPdf(null)} className="absolute top-3 right-3 text-white bg-red-500 px-3 py-1 rounded-full z-10">
                ×
              </button>
              <iframe src={previewPdf} className="w-full h-full" title="PDF preview" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-1 w-full" />
      </div>
    );
  }
);

export default ChatBox;
