package com.chatapp.websocket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SocketEventListener {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final Set<String> onlineUsers = ConcurrentHashMap.newKeySet();

    // ================= CONNECT =================
    @EventListener
    public void handleConnect(SessionConnectedEvent event) {

        if (event.getUser() == null) return;

        String userId = event.getUser().getName();

        onlineUsers.add(userId);

        // 🔥 gửi trạng thái user vừa online
        messagingTemplate.convertAndSend(
                "/topic/users/status",
                Map.of(
                        "userId", userId,
                        "status", "ONLINE"
                )
        );

        // 🔥 (OPTIONAL) gửi full list online cho FE sync lại
        messagingTemplate.convertAndSend(
                "/topic/users/list",
                onlineUsers
        );

        System.out.println("🟢 ONLINE: " + userId);
    }

    // ================= DISCONNECT =================
    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {

        if (event.getUser() == null) return;

        String userId = event.getUser().getName();

        onlineUsers.remove(userId);

        // 🔥 gửi OFFLINE
        messagingTemplate.convertAndSend(
                "/topic/users/status",
                Map.of(
                        "userId", userId,
                        "status", "OFFLINE"
                )
        );

        messagingTemplate.convertAndSend(
                "/topic/users/list",
                onlineUsers
        );

        System.out.println("🔴 OFFLINE: " + userId);
    }
}
