import { Client, IMessage, StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let stompClient: Client | null = null;
let roomSubscription: StompSubscription | null = null;

// Android emulator
const SOCKJS_URL = "http://10.0.2.2:8080/ws";
// máy thật: http://IP_MAY_TINH:8080/ws

type ConnectParams = {
  userId: string | number;
  roomId: string;
  onMessage: (message: any) => void;
};

export const connectChatSocket = ({
  userId,
  roomId,
  onMessage,
}: ConnectParams) => {
  if (stompClient?.active) {
    disconnectChatSocket();
  }

  stompClient = new Client({
    webSocketFactory: () => new SockJS(`${SOCKJS_URL}?userId=${userId}`),
    reconnectDelay: 5000,
    debug: (str) => {
      console.log("STOMP:", str);
    },
    onConnect: () => {
      console.log("STOMP connected");

      roomSubscription =
        stompClient?.subscribe(`/topic/chat/${roomId}`, (message: IMessage) => {
          try {
            const body = JSON.parse(message.body);
            onMessage(body);
          } catch (error) {
            console.log("parse socket message error:", error);
          }
        }) || null;
    },
    onStompError: (frame) => {
      console.log("STOMP error:", frame.headers["message"]);
      console.log("STOMP details:", frame.body);
    },
    onWebSocketClose: (event) => {
      console.log("WebSocket closed:", event);
    },
    onWebSocketError: (event) => {
      console.log("WebSocket error:", event);
    },
  });

  stompClient.activate();
};

export const disconnectChatSocket = () => {
  try {
    roomSubscription?.unsubscribe();
    roomSubscription = null;
    stompClient?.deactivate();
    stompClient = null;
  } catch (error) {
    console.log("disconnect socket error:", error);
  }
};

export const sendSocketMessage = (payload: any) => {
  if (!stompClient || !stompClient.connected) {
    console.log("STOMP chưa connected");
    return false;
  }

  stompClient.publish({
    destination: "/app/chat.send",
    body: JSON.stringify(payload),
  });

  return true;
};