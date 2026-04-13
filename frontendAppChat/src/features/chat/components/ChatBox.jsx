import React, { memo, useEffect, useMemo, useState } from "react";
import { deleteMessageApi, recallMessageApi } from "../api/chatApi";

const BASE_URL = "http://localhost:8080";

const ChatBox = memo(
  ({
    messages = [],
    setMessages,
    messagesEndRef,
    currentUserId,
    onForwardMessage,
  }) => {
    const [selectedMessageId, setSelectedMessageId] = useState(null);
    const [previewPdf, setPreviewPdf] = useState(null);

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

      // fix data cũ bị dính port 5173
      if (url.includes("localhost:5173")) {
        return url.replace("localhost:5173", "localhost:8080");
      }

      return url;
    };

    // ================= RENDER =================
    return (
      <div className="h-full w-full overflow-y-auto p-4 space-y-4 bg-[#0f172a]">
        {visibleMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 italic">
            Bắt đầu cuộc trò chuyện...
          </div>
        ) : (
          visibleMessages.map((msg) => {
            const senderId =
              msg.senderId || msg.sender?._id || msg.sender || msg.userId;

            const isMe = Number(senderId) === Number(currentUserId);
            const messageId = msg._id || msg.id;

            return (
              <div
                key={messageId}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`flex flex-col ${
                    isMe ? "items-end" : "items-start"
                  } max-w-[75%]`}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMessageId(messageId);
                    }}
                    className="relative"
                  >
                    {/* MESSAGE */}
                    <div
                      className={`px-4 py-2 shadow-md ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-2xl rounded-tr-none"
                          : "bg-slate-700 text-slate-100 rounded-2xl rounded-tl-none"
                      }`}
                    >
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
                              {msg.originalContent}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[15px] break-words">
                          {msg.content || msg.text}
                        </p>
                      )}
                    </div>

                    {/* MENU */}
                    {selectedMessageId === messageId && (
                      <div className="absolute -top-8 right-0 flex gap-2">
                        {!msg.isRecalled && (
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
