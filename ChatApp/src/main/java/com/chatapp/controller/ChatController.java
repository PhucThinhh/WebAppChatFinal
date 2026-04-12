package com.chatapp.controller;

import com.chatapp.dto.SendMessageDTO;
import com.chatapp.entity.Message;
import com.chatapp.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void send(SendMessageDTO dto) {

        Message saved = chatService.sendMessage(dto);

        messagingTemplate.convertAndSend(
                "/topic/chat/" + saved.getRoomId(),
                saved
        );
    }

    @GetMapping("/messages/{roomId}")
    public List<Message> getMessages(@PathVariable String roomId) {
        return chatService.getMessages(roomId);
    }
}
