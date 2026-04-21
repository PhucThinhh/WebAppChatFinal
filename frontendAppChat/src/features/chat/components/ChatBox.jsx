import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { deleteMessageApi, recallMessageApi } from "../api/chatApi";

const BASE_URL = "http://localhost:8080";

const ChatBox = memo(
  ({
    messages = [],
    setMessages,
    messagesEndRef,
    currentUserId,
    onForwardMessage,
    showSearch = false,
    onCloseSearch,
  }) => {
    const [selectedMessageId, setSelectedMessageId] = useState(null);
    const [previewPdf, setPreviewPdf] = useState(null);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [matchIndexes, setMatchIndexes] = useState([]);
    const [activeMatchPos, setActiveMatchPos] = useState(-1);
    const messageRefs = useRef({});

    // ================= AUTO SCROLL =================
    useEffect(() => {
      requestAnimationFrame(() => {
        messagesEndRef?.current?.scrollIntoView({ behavior: "smooth" });
      });
    }, [messages]);

    // ================= CLICK OUTSIDE =================
    useEffect(() => {
      const handleClickOutside = () => {
        setSelectedMessageId(null);
      };
      window.addEventListener("click", handleClickOutside);
      return () => window.removeEventListener("click", handleClickOutside);
    }, []);

    // ================= FILTER XOÁ 1 CHIỀU =================
    const visibleMessages = useMemo(() => {
      return messages.filter((msg) => {
        if (!msg.deletedBy) return true;
        return Number(msg.deletedBy) !== Number(currentUserId);
      });
    }, [messages, currentUserId]);

    const normalizedKeyword = searchKeyword.trim().toLowerCase();

    const getSearchableText = (msg) => {
      return String(msg?.content || msg?.text || msg?.originalContent || "");
    };

    const scrollToMatch = (matchPos) => {
      if (matchPos < 0 || matchPos >= matchIndexes.length) return;
      const targetMessageIndex = matchIndexes[matchPos];
      const targetMessage = visibleMessages[targetMessageIndex];
      const targetId = targetMessage?._id || targetMessage?.id;
      if (!targetId) return;

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
        const text = getSearchableText(msg).toLowerCase();
        if (text.includes(normalizedKeyword)) {
          indexes.push(index);
        }
      });

      setMatchIndexes(indexes);

      if (indexes.length === 0) {
        setActiveMatchPos(-1);
        return;
      }

      const nearestPos = indexes.length - 1;
      setActiveMatchPos(nearestPos);
    }, [normalizedKeyword, visibleMessages]);

    useEffect(() => {
      if (activeMatchPos >= 0) {
        scrollToMatch(activeMatchPos);
      }
    }, [activeMatchPos, matchIndexes]);

    const jumpPrev = () => {
      if (matchIndexes.length === 0) return;
      setActiveMatchPos((prev) =>
        prev <= 0 ? matchIndexes.length - 1 : prev - 1
      );
    };

    const jumpNext = () => {
      if (matchIndexes.length === 0) return;
      setActiveMatchPos((prev) =>
        prev >= matchIndexes.length - 1 ? 0 : prev + 1
      );
    };

    const escapeRegex = (value) =>
      value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const renderHighlightedText = (text) => {
      const safeText = String(text || "");
      if (!normalizedKeyword) return safeText;

      const regex = new RegExp(`(${escapeRegex(normalizedKeyword)})`, "gi");
      const parts = safeText.split(regex);

      return parts.map((part, idx) => {
        const isHit = part.toLowerCase() === normalizedKeyword;
        if (!isHit) return <React.Fragment key={idx}>{part}</React.Fragment>;
        return (
          <mark
            key={idx}
            className="bg-yellow-300/90 text-slate-900 px-0.5 rounded-sm"
          >
            {part}
          </mark>
        );
      });
    };

    // ================= DELETE =================
    const handleDeleteMessage = async (id) => {
      try {
        await deleteMessageApi(id);

        setMessages((prev) =>
          prev.map((m) =>
            String(m.id) === String(id) ? { ...m, deletedBy: currentUserId } : m
          )
        );
      } catch (err) {
        console.log("Delete error:", err);
      }
    };

    // ================= RECALL =================
    const handleRecallMessage = async (id) => {
      try {
        await recallMessageApi(id);

        setMessages((prev) =>
          prev.map((m) =>
            String(m.id) === String(id) ? { ...m, isRecalled: true } : m
          )
        );
      } catch (err) {
        console.log("Recall error:", err);
      }
    };

    // ================= HELPER =================
    const getFileUrl = (url) => {
      if (!url) return "";
      const normalized = String(url).trim();

      if (normalized.startsWith("/")) {
        return `${BASE_URL}${normalized}`;
      }

      // fix data cũ bị dính port 5173
      if (normalized.includes("localhost:5173")) {
        return normalized.replace("localhost:5173", "localhost:8080");
      }

      // fix data từ mobile emulator
      if (normalized.includes("10.0.2.2:8080")) {
        return normalized.replace("10.0.2.2:8080", "localhost:8080");
      }

      return normalized;
    };

    // ================= RENDER =================
    return (
      <div className="h-full w-full overflow-y-auto p-4 space-y-4 bg-[#0f172a]">
        {showSearch && (
          <div className="sticky top-0 z-30 bg-[#0f172a]/95 backdrop-blur-sm pb-3">
            <div className="flex items-center gap-2">
              <input
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm trong cuộc trò chuyện..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none"
              />
              <button
                onClick={jumpPrev}
                disabled={matchIndexes.length === 0}
                className="px-2.5 py-2 rounded-lg bg-slate-800 text-slate-200 disabled:opacity-40"
              >
                ↑
              </button>
              <button
                onClick={jumpNext}
                disabled={matchIndexes.length === 0}
                className="px-2.5 py-2 rounded-lg bg-slate-800 text-slate-200 disabled:opacity-40"
              >
                ↓
              </button>
              <button
                onClick={onCloseSearch}
                className="px-2.5 py-2 rounded-lg bg-slate-800 text-slate-300"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {matchIndexes.length === 0
                ? "Không có kết quả"
                : `Kết quả: ${activeMatchPos + 1}/${matchIndexes.length}`}
            </div>
          </div>
        )}

        {visibleMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 italic">
            Bắt đầu cuộc trò chuyện...
          </div>
        ) : (
          visibleMessages.map((msg) => {
            const senderId =
              msg.senderId || msg.sender?._id || msg.sender || msg.userId;

            const isMe = Number(senderId) === Number(currentUserId);
            const isBot = Number(senderId) === 0;
            const isSystem = String(msg?.type || "").toUpperCase() === "SYSTEM";
            const messageId = msg._id || msg.id;

            return (
              <div
                key={messageId}
                ref={(node) => {
                  if (node) messageRefs.current[messageId] = node;
                }}
                className={`flex ${
                  isSystem
                    ? "justify-center"
                    : isBot
                    ? "justify-center"
                    : isMe
                      ? "justify-end"
                      : "justify-start"
                }`}
              >
                <div
                  className={`flex flex-col ${
                    isSystem
                      ? "items-center"
                      : isBot
                      ? "items-center"
                      : isMe
                        ? "items-end"
                        : "items-start"
                  } ${isSystem || isBot ? "max-w-[90%]" : "max-w-[75%]"}`}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isSystem) setSelectedMessageId(messageId);
                    }}
                    className="relative"
                  >
                    {/* MESSAGE */}
                    <div
                      className={`px-4 py-2 shadow-md ${
                        isSystem
                          ? "bg-slate-800/60 border border-slate-600/50 text-slate-300 rounded-full text-sm italic"
                          : isBot
                          ? "bg-emerald-950/80 border border-emerald-700/50 text-emerald-50 rounded-2xl"
                          : isMe
                            ? "bg-indigo-600 text-white rounded-2xl rounded-tr-none"
                            : "bg-slate-700 text-slate-100 rounded-2xl rounded-tl-none"
                      }`}
                    >
                      {isBot && !isSystem && (
                        <div className="text-[10px] uppercase tracking-wide text-emerald-400/90 mb-1 font-medium">
                          Trợ lý AI
                        </div>
                      )}
                      {msg.isRecalled ? (
                        <p className="italic text-slate-400">
                          {isMe
                            ? "Bạn đã thu hồi tin nhắn"
                            : "Tin nhắn đã được thu hồi"}
                        </p>
                      ) : msg.type === "FILE" ? (
                        msg.fileUrl?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                          <img
                            src={getFileUrl(msg.fileUrl)}
                            alt="file"
                            className="w-40 rounded-lg"
                          />
                        ) : msg.fileUrl?.endsWith(".pdf") ? (
                          <button
                            onClick={() =>
                              setPreviewPdf(getFileUrl(msg.fileUrl))
                            }
                            className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg hover:bg-slate-700"
                          >
                            📕 {msg.fileUrl.split("/").pop()}
                          </button>
                        ) : (
                          <a
                            href={getFileUrl(msg.fileUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg hover:bg-slate-700"
                          >
                            📎 {msg.fileUrl.split("/").pop()}
                          </a>
                        )
                      ) : msg.type === "FORWARD" ? (
                        <div className="text-sm">
                          <div className="text-slate-400 text-xs mb-1">
                            Chuyển tiếp
                          </div>

                          {msg.fileUrl ? (
                            msg.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                              <img
                                src={getFileUrl(msg.fileUrl)}
                                className="w-40 rounded-lg"
                              />
                            ) : (
                              <a
                                href={getFileUrl(msg.fileUrl)}
                                target="_blank"
                                className="flex items-center gap-2 bg-slate-800 px-3 py-2 rounded-lg"
                              >
                                📎 {msg.fileUrl.split("/").pop()}
                              </a>
                            )
                          ) : (
                            <div className="bg-slate-800 p-2 rounded-lg">
                              {renderHighlightedText(msg.originalContent)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[15px] break-words">
                          {renderHighlightedText(msg.content || msg.text)}
                        </p>
                      )}
                    </div>

                    {/* MENU */}
                    {selectedMessageId === messageId && !isSystem && (
                      <div
                        className={`absolute top-full mt-2 z-20 flex gap-2 ${
                          isMe ? "right-0" : "left-0"
                        }`}
                      >
                        {!msg.isRecalled && !isBot && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRecallMessage(messageId);
                              setSelectedMessageId(null);
                            }}
                            className="bg-yellow-500 text-white text-xs px-2 py-1 rounded"
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
                          className="bg-red-500 text-white text-xs px-2 py-1 rounded"
                        >
                          Xoá
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onForwardMessage(msg);
                            setSelectedMessageId(null);
                          }}
                          className="bg-blue-500 text-white text-xs px-2 py-1 rounded"
                        >
                          Chuyển tiếp
                        </button>
                      </div>
                    )}
                  </div>

                  {/* TIME */}
                  {(msg.createdAt || msg.time) && (
                    <span className="text-[10px] text-slate-500 mt-1 px-1">
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : msg.time}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* PDF PREVIEW */}
        {previewPdf && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[999]">
            <div className="bg-slate-900 rounded-xl w-[80%] h-[80%] relative">
              <button
                onClick={() => setPreviewPdf(null)}
                className="absolute top-2 right-2 text-white bg-red-500 px-3 py-1 rounded"
              >
                ✕
              </button>

              <iframe src={previewPdf} className="w-full h-full rounded-xl" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-1 w-full" />
      </div>
    );
  }
);

export default ChatBox;
