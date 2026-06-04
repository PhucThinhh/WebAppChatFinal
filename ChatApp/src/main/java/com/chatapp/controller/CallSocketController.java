package com.chatapp.controller;

import com.chatapp.dto.CallSignalDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class CallSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/call.signal")
    public void handleCallSignal(CallSignalDTO signal) {

        if (signal == null || signal.getRoomId() == null) {
            return;
        }

        // Gửi tín hiệu call theo room chat
        messagingTemplate.convertAndSend(
                "/topic/call/" + signal.getRoomId(),
                signal
        );
    }
}