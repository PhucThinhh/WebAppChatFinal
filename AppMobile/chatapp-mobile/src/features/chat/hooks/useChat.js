import { useEffect, useRef, useState } from "react";

export default function useChat() {
  const [messages, setMessages] = useState([
    {
      text: "Hello mobile 👋",
      sender: "me",
      time: "08:40",
    },
    {
      text: "Giao diện này ổn chưa?",
      sender: "other",
      time: "08:42",
    },
  ]);

  const [input, setInput] = useState("");
  const flatListRef = useRef();

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
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return {
    messages,
    input,
    setInput,
    sendMessage,
    flatListRef,
  };
}
