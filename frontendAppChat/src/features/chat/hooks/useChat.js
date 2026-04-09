import { useState, useRef, useEffect } from "react";

function useChat() {
  const [messages, setMessages] = useState([
    {
      text: "console.log('server running localhost http://localhost:3000/')",
      sender: "me",
      time: "08:40",
    },
    {
      text: "Giao diện này nhìn ổn chưa bạn?",
      sender: "other",
      time: "08:42",
    },
  ]);

  const [input, setInput] = useState("");
  const messagesEndRef = useRef();

  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        text: input,
        sender: "me",
        time: new Date().toLocaleTimeString().slice(0, 5),
      },
    ]);

    setInput("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return {
    messages,
    input,
    setInput,
    sendMessage,
    messagesEndRef,
  };
}
export default useChat