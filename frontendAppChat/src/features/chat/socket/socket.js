import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let stompClient = null;
let connectionState = "DISCONNECTED";

let activeRooms = {};
let pendingRooms = {};
let statusSubscription = null;
let currentSocketUserId = null;

// ================= GLOBAL LOGOUT =================
window.addEventListener("storage", (event) => {
  if (event.key === "token" && !event.newValue) {
    disconnectSocket();
  }
});

// ================= CONNECT =================
export const connectSocket = (userId, onReady) => {
  currentSocketUserId = String(userId);

  const token = localStorage.getItem("token");
  if (!token) return;

  if (stompClient) return;

  stompClient = new Client({
    webSocketFactory: () =>
      new SockJS(`http://localhost:8080/ws?userId=${userId}`),

    reconnectDelay: 5000,

    debug: (str) => console.log("STOMP:", str),

    onConnect: () => {
      console.log("✅ SOCKET CONNECTED");

      connectionState = "CONNECTED";

      // restore active rooms
      Object.entries(activeRooms).forEach(([roomId, cb]) => {
        internalJoinRoom(
          roomId,
          cb.callback,
          cb.deleteCallback,
          cb.recallCallback,
          cb.moderationCallback,
          cb.reactionCallback
        );
      });

      // restore pending rooms
      Object.entries(pendingRooms).forEach(([roomId, cb]) => {
        internalJoinRoom(roomId, cb.onMessage, cb.onDelete, cb.onRecall, cb.onModeration, cb.onReaction);
      });

      pendingRooms = {};

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
const internalJoinRoom = (roomId, onMessage, onDelete, onRecall, onModeration, onReaction) => {
  if (!stompClient) return;

  const existing = activeRooms[roomId];
  if (existing) {
    existing.messageSub?.unsubscribe();
    existing.deleteSub?.unsubscribe();
    existing.recallSub?.unsubscribe();
    existing.moderationSub?.unsubscribe();
    existing.reactionSub?.unsubscribe();
    delete activeRooms[roomId];
  }

  // ================= MESSAGE =================
  const messageSub = stompClient.subscribe(`/topic/chat/${roomId}`, (msg) => {
    try {
      const data = JSON.parse(msg.body);
      onMessage?.(data);
    } catch (err) {
      console.error("Parse message error:", err);
    }
  });

  // ================= DELETE =================
  const deleteSub = stompClient.subscribe(
    `/topic/chat/${roomId}/delete`,
    (msg) => {
      try {
        const deletedId = msg.body;
        console.log("🗑 DELETE ID:", deletedId);
        onDelete?.(deletedId);
      } catch (err) {
        console.error("Parse delete error:", err);
      }
    }
  );

  // ================= RECALL =================
  const recallSub = stompClient.subscribe(
    `/topic/chat/${roomId}/recall`,
    (msg) => {
      try {
        const recallId = msg.body;
        console.log("♻️ RECALL ID:", recallId);
        onRecall?.(recallId);
      } catch (err) {
        console.error("Parse recall error:", err);
      }
    }
  );

  const moderationSub = stompClient.subscribe(
    `/topic/chat/${roomId}/moderation/${currentSocketUserId}`,
    (msg) => {
      try {
        const data = JSON.parse(msg.body);
        onModeration?.(data);
      } catch (err) {
        console.error("Parse moderation error:", err);
      }
    }
  );

  const reactionSub = stompClient.subscribe(
    `/topic/chat/${roomId}/reaction`,
    (msg) => {
      try {
        const data = JSON.parse(msg.body);
        onReaction?.(data);
        window.dispatchEvent(new CustomEvent("chat-message-reaction", { detail: data }));
      } catch (err) {
        console.error("Parse reaction error:", err);
      }
    }
  );

  activeRooms[roomId] = {
    messageSub,
    deleteSub,
    recallSub,
    moderationSub,
    reactionSub,
    callback: onMessage,
    deleteCallback: onDelete,
    recallCallback: onRecall,
    moderationCallback: onModeration,
    reactionCallback: onReaction,
  };

  console.log("📌 Joined room:", roomId);
};

// ================= JOIN ROOM =================
export const joinRoom = (roomId, onMessage, onDelete, onRecall, onModeration, onReaction) => {
  if (!stompClient) return;

  if (connectionState !== "CONNECTED") {
    pendingRooms[roomId] = { onMessage, onDelete, onRecall, onModeration, onReaction };
    return;
  }

  internalJoinRoom(roomId, onMessage, onDelete, onRecall, onModeration, onReaction);
};

// ================= LEAVE ROOM =================
export const leaveRoom = (roomId) => {
  if (activeRooms[roomId]) {
    activeRooms[roomId].messageSub?.unsubscribe();
    activeRooms[roomId].deleteSub?.unsubscribe();
    activeRooms[roomId].recallSub?.unsubscribe();
    activeRooms[roomId].moderationSub?.unsubscribe();
    activeRooms[roomId].reactionSub?.unsubscribe();

    delete activeRooms[roomId];

    console.log("🚪 Left room:", roomId);
  }
};

// ================= SEND MESSAGE =================
export const sendMessageSocket = (message) => {
  const token = localStorage.getItem("token");

  if (!token || connectionState !== "CONNECTED" || !stompClient) {
    console.log("BLOCK SEND - socket not ready");
    return;
  }

  stompClient.publish({
    destination: "/app/chat.send",
    body: JSON.stringify(message),
  });
};

export const sendCallSignal = (payload) => {
  const token = localStorage.getItem("token");

  if (!token || connectionState !== "CONNECTED" || !stompClient) {
    console.log("BLOCK CALL - socket not ready");
    return false;
  }

  stompClient.publish({
    destination: "/app/call.signal",
    body: JSON.stringify(payload),
  });

  return true;
};

export const subscribeCallSignals = (userId, callback) => {
  if (!stompClient || connectionState !== "CONNECTED" || !userId) return;

  return stompClient.subscribe(`/topic/call/${userId}`, (msg) => {
    try {
      const data = JSON.parse(msg.body || "{}");
      callback?.(data);
    } catch (err) {
      console.error("Parse call signal error:", err);
    }
  });
};

// ================= SUBSCRIBE ONLINE STATUS =================
export const subscribeUserStatus = (callback) => {
  if (!stompClient || connectionState !== "CONNECTED") return;

  // 🔥 unsubscribe cũ nếu có
  if (statusSubscription) {
    statusSubscription.unsubscribe();
  }

  statusSubscription = stompClient.subscribe("/topic/users/status", (msg) => {
    const data = JSON.parse(msg.body);
    console.log("👤 STATUS:", data);
    callback?.(data);
  });

  return statusSubscription;
};

export const subscribeGroupUpdates = (userId, callback) => {
  if (!stompClient || connectionState !== "CONNECTED" || !userId) return;

  return stompClient.subscribe(`/topic/group-updates/${userId}`, (msg) => {
    try {
      const data = JSON.parse(msg.body || "{}");
      callback?.(data);
    } catch {
      callback?.({});
    }
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
  currentSocketUserId = null;

  console.log("❌ SOCKET DISCONNECTED");
};
export const subscribeOnlineList = (callback) => {
  if (!stompClient || connectionState !== "CONNECTED") return;

  return stompClient.subscribe("/topic/users/list", (msg) => {
    const data = JSON.parse(msg.body);
    console.log("👥 ONLINE LIST:", data);
    callback?.(data);
  });
};
