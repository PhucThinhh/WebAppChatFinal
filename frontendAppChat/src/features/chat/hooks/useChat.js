import { useState, useRef, useEffect } from "react";

function useChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // ================= HELPER =================
  const getId = (m) => m._id || m.id;

  const isSameOutgoingMessage = (a, b) => {
    const aSender = Number(a?.senderId);
    const bSender = Number(b?.senderId);
    if (!Number.isFinite(aSender) || aSender !== bSender) return false;

    const aContent = String(a?.content || "");
    const bContent = String(b?.content || "");
    if (aContent !== bContent) return false;

    const aType = String(a?.type || "TEXT").toUpperCase();
    const bType = String(b?.type || "TEXT").toUpperCase();
    if (aType !== bType) return false;

    const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : Date.now();
    return Math.abs(bTime - aTime) < 10000;
  };

  // ================= ADD MESSAGE =================
  const addMessage = (message) => {
    setMessages((prev) => {
      const messageId = getId(message);
      if (messageId && prev.some((m) => String(getId(m)) === String(messageId))) {
        return prev.map((m) =>
          String(getId(m)) === String(messageId) ? { ...m, ...message, isOptimistic: false } : m
        );
      }

      const optimisticIndex = prev.findIndex(
        (m) => m.isOptimistic && isSameOutgoingMessage(m, message)
      );

      if (optimisticIndex >= 0) {
        return prev.map((m, index) =>
          index === optimisticIndex ? { ...m, ...message, isOptimistic: false } : m
        );
      }

      return [...prev, message];
    });
  };

  // ================= LOAD HISTORY =================
  const replaceMessages = (list) => {
    setMessages(list);
  };

  // ================= DELETE MESSAGE (🔥 QUAN TRỌNG) =================
  const deleteMessage = (messageId, userId) => {
    setMessages((prev) =>
      prev.map((m) =>
        getId(m) === messageId
          ? { ...m, deletedBy: userId } // 👈 gắn người xoá
          : m
      )
    );
  };

  // ================= SEND MESSAGE LOCAL =================
  const sendMessageLocal = (text) => {
    if (!text.trim()) return;

    const msg = {
      text,
      sender: "me",
      time: new Date().toLocaleTimeString().slice(0, 5),
    };

    setMessages((prev) => [...prev, msg]);
    setInput("");
  };

  // ================= AUTO SCROLL =================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return {
    messages,
    setMessages,
    addMessage,
    replaceMessages,
    deleteMessage, // 👈 thêm cái này
    input,
    setInput,
    sendMessageLocal,
    messagesEndRef,
  };
}

export default useChat;
