import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let stompClient = null;

// ================= STATE =================
let connectionState = "DISCONNECTED";

// chat rooms
let activeRooms = {};
let pendingRooms = {};

// online status subscription
let statusSubscription = null;

// ================= CONNECT =================
export const connectSocket = (userId, onReady) => {
  if (stompClient) return;

  stompClient = new Client({
    webSocketFactory: () =>
      new SockJS(`http://localhost:8080/ws?userId=${userId}`),

    reconnectDelay: 5000,

    debug: (str) => console.log("STOMP:", str),

    onConnect: () => {
      console.log("✅ SOCKET CONNECTED");

      connectionState = "CONNECTED";

      // ================= restore rooms =================
      Object.entries(activeRooms).forEach(([roomId, cb]) => {
        internalJoinRoom(roomId, cb);
      });

      Object.entries(pendingRooms).forEach(([roomId, cb]) => {
        internalJoinRoom(roomId, cb);
      });

      pendingRooms = {};

      // ================= ONLINE/OFFLINE =================
      if (!statusSubscription) {
        statusSubscription = stompClient.subscribe(
          "/topic/users/status",
          (msg) => {
            const data = JSON.parse(msg.body);
            console.log("👤 STATUS:", data);
          }
        );
      }

      onReady?.();
    },

    onStompError: (frame) => {
      console.error("❌ STOMP ERROR:", frame);
    },

    onDisconnect: () => {
      console.log("🔌 SOCKET DISCONNECTED");
      connectionState = "DISCONNECTED";
    },
  });

  stompClient.activate();
};

// ================= INTERNAL JOIN ROOM =================
const internalJoinRoom = (roomId, onMessage) => {
  if (!stompClient) return;

  if (activeRooms[roomId]) return;

  const subscription = stompClient.subscribe(`/topic/chat/${roomId}`, (msg) => {
    try {
      const data = JSON.parse(msg.body);
      onMessage?.(data);
    } catch (err) {
      console.error("Parse error:", err);
    }
  });

  activeRooms[roomId] = {
    subscription,
    callback: onMessage,
  };

  console.log("📌 Joined room:", roomId);
};

// ================= JOIN ROOM =================
export const joinRoom = (roomId, onMessage) => {
  if (!stompClient) return;

  if (connectionState !== "CONNECTED") {
    pendingRooms[roomId] = onMessage;
    return;
  }

  internalJoinRoom(roomId, onMessage);

  return activeRooms[roomId]?.subscription;
};

// ================= LEAVE ROOM =================
export const leaveRoom = (roomId) => {
  if (activeRooms[roomId]) {
    activeRooms[roomId].subscription?.unsubscribe();
    delete activeRooms[roomId];
    console.log("🚪 Left room:", roomId);
  }
};

// ================= SEND MESSAGE =================
export const sendMessageSocket = (message) => {
  if (connectionState !== "CONNECTED" || !stompClient) {
    console.log("BLOCK SEND - socket not ready");
    return;
  }

  stompClient.publish({
    destination: "/app/chat.send",
    body: JSON.stringify(message),
  });
};

// ================= SUBSCRIBE ONLINE STATUS =================
export const subscribeUserStatus = (callback) => {
  if (!stompClient || connectionState !== "CONNECTED") return;

  if (statusSubscription) return;

  statusSubscription = stompClient.subscribe("/topic/users/status", (msg) => {
    const data = JSON.parse(msg.body);
    callback?.(data);
  });
};

// ================= DISCONNECT =================
export const disconnectSocket = () => {
  stompClient?.deactivate();

  stompClient = null;
  connectionState = "DISCONNECTED";

  activeRooms = {};
  pendingRooms = {};

  statusSubscription = null;

  console.log("❌ SOCKET DISCONNECTED");
};
