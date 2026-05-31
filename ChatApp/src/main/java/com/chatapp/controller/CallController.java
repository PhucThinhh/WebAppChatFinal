package com.chatapp.controller;

import com.chatapp.entity.CallHistory;
import com.chatapp.service.CallService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class CallController {

    private final SimpMessagingTemplate messagingTemplate;
    private final CallService callService;

    @MessageMapping("/call.signal")
    public void signal(Map<String, Object> payload) {
        Object toUserId = payload.get("toUserId");

        if (toUserId == null) {
            return;
        }

        callService.handleSignal(payload);
        messagingTemplate.convertAndSend("/topic/call/" + toUserId, payload);
    }

    @GetMapping("/api/calls/history/{roomId}")
    @ResponseBody
    public List<CallHistory> history(@PathVariable String roomId) {
        return callService.getHistory(roomId);
    }
}
