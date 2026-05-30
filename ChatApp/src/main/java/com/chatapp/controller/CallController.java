package com.chatapp.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class CallController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/call.signal")
    public void signal(Map<String, Object> payload) {
        Object toUserId = payload.get("toUserId");

        if (toUserId == null) {
            return;
        }

        messagingTemplate.convertAndSend("/topic/call/" + toUserId, payload);
    }
}
