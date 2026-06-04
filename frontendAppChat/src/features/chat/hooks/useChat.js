import { useState, useRef } from "react";

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

  // ================= DELETE MESSAGE =================
  const deleteMessage = (messageId, userId) => {
    setMessages((prev) =>
      prev.map((m) =>
        String(getId(m)) === String(messageId)
          ? {
              ...m,
              deletedBy: userId,
            }
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

  return {
    messages,
    setMessages,
    addMessage,
    replaceMessages,
    deleteMessage,
    input,
    setInput,
    sendMessageLocal,
    messagesEndRef,
  };
}

export default useChat;
