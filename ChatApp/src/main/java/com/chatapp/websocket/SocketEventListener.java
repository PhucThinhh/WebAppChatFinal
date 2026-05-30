package com.chatapp.websocket;

import com.chatapp.service.OnlineUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@RequiredArgsConstructor
public class SocketEventListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final OnlineUserService onlineUserService;
    private final Map<String, String> sessionUsers = new ConcurrentHashMap<>();

    @EventListener
    public void handleConnect(SessionConnectedEvent event) {
        if (event.getUser() == null) return;

        String userId = event.getUser().getName();
        Object sessionId = event.getMessage().getHeaders().get("simpSessionId");
        if (sessionId != null) {
            sessionUsers.put(sessionId.toString(), userId);
        }

        boolean firstConnection = onlineUserService.connect(userId);

        if (firstConnection) {
            messagingTemplate.convertAndSend(
                    "/topic/users/status",
                    Map.of("userId", userId, "status", "ONLINE")
            );
        }

        messagingTemplate.convertAndSend(
                "/topic/users/list",
                onlineUserService.getOnlineUsers()
        );

        System.out.println("ONLINE: " + userId);
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        String userId = event.getUser() != null
                ? event.getUser().getName()
                : sessionUsers.get(event.getSessionId());

        if (userId == null) return;

        sessionUsers.remove(event.getSessionId());
        boolean lastConnection = onlineUserService.disconnect(userId);

        if (lastConnection) {
            messagingTemplate.convertAndSend(
                    "/topic/users/status",
                    Map.of("userId", userId, "status", "OFFLINE")
            );
        }

        messagingTemplate.convertAndSend(
                "/topic/users/list",
                onlineUserService.getOnlineUsers()
        );

        System.out.println("OFFLINE: " + userId);
    }
}
