package com.chatapp.service;

import com.chatapp.dto.SendMessageDTO;
import com.chatapp.entity.Message;
import com.chatapp.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final MessageRepository messageRepository;

    public Message sendMessage(SendMessageDTO dto) {

        String roomId = generateRoomId(dto.getSenderId(), dto.getReceiverId());

        Message message = Message.builder()
                .senderId(dto.getSenderId())
                .receiverId(dto.getReceiverId())
                .roomId(roomId)
                .content(dto.getContent())
                .type(dto.getType())
                .fileUrl(dto.getFileUrl())
                .isDeleted(false)
                .isRecalled(false)
                .createdAt(LocalDateTime.now())
                .build();

        return messageRepository.save(message);
    }

    private String generateRoomId(Long a, Long b) {
        return (a < b) ? a + "_" + b : b + "_" + a;
    }
    public List<Message> getMessages(String roomId) {
        return messageRepository.findByRoomIdOrderByCreatedAtAsc(roomId);
    }


}
