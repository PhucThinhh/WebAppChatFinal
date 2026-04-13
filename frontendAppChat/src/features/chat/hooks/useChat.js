import { useState, useRef, useEffect } from "react";

function useChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // ================= HELPER =================
  const getId = (m) => m._id || m.id;

  // ================= ADD MESSAGE =================
  const addMessage = (message) => {
    setMessages((prev) => [...prev, message]);
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
