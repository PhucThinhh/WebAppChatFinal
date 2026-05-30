import { Client } from "@stomp/stompjs";

let stompClient = null;

export const connectSocket = (userId, onConnected) => {
  if (stompClient) return;

  stompClient = new Client({
    brokerURL: `ws://10.0.2.2:8080/ws-native?userId=${userId}`,

    reconnectDelay: 5000,

    debug: (str) => console.log("STOMP:", str),

    onConnect: () => {
      console.log("✅ MOBILE SOCKET CONNECTED");
      onConnected?.();
    },

    onStompError: (frame) => {
      console.log("❌ STOMP ERROR:", frame);
    },
  });

  stompClient.activate();
};
