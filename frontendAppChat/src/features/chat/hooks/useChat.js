import { useState, useRef, useEffect } from "react";

function useChat() {
  const [messages, setMessages] = useState([]); // ❌ bỏ message fake Hello
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // ================= ADD MESSAGE =================
  const addMessage = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  // ================= SET MESSAGES (LOAD HISTORY) =================
  const replaceMessages = (list) => {
    setMessages(list);
  };

  // ================= SEND MESSAGE LOCAL (optional) =================
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
    setMessages, // 🔥 QUAN TRỌNG (load history)
    addMessage,
    replaceMessages, // optional
    input,
    setInput,
    sendMessageLocal,
    messagesEndRef,
  };
}

export default useChat;
