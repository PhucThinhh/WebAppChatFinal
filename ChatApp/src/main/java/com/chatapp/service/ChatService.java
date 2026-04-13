package com.chatapp.service;

import com.chatapp.dto.SendMessageDTO;
import com.chatapp.entity.Message;
import com.chatapp.repository.ConversationStateRepository;
import com.chatapp.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.chatapp.entity.ConversationState;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final MessageRepository messageRepository;
    private final ConversationService conversationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ConversationStateRepository conversationRepository;
    private final BlockedService blockedService;

    // =========================
    // SEND MESSAGE
    // =========================
    public Message sendMessage(SendMessageDTO dto) {

        // 🔥 CHẶN NGAY
        if (blockedService.isEitherBlocked(dto.getSenderId(), dto.getReceiverId())) {
            System.out.println("🚫 BLOCKED MESSAGE");
            return null; // ❌ KHÔNG gửi gì cả
        }

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
                .originalSenderId(
                        "FORWARD".equals(dto.getType()) ? dto.getOriginalSenderId() : null
                )
                .originalContent(
                        "FORWARD".equals(dto.getType()) ? dto.getOriginalContent() : null
                )
                .originalMessageId(
                        "FORWARD".equals(dto.getType()) ? dto.getOriginalMessageId() : null
                )
                .createdAt(LocalDateTime.now())
                .build();

        Message saved = messageRepository.save(message);

        messagingTemplate.convertAndSend(
                "/topic/chat/" + roomId,
                saved
        );

        return saved;
    }

    // =========================
    // GET MESSAGES
    // =========================
    public List<Message> getMessages(String roomId, Long userId) {

        ConversationState state = conversationRepository
                .findByConversationKeyAndUserId(roomId, userId)
                .orElse(null);

        List<Message> messages =
                messageRepository.findByRoomIdOrderByCreatedAtAsc(roomId);

        if (state != null && Boolean.TRUE.equals(state.getIsDeleted())) {
            return messages.stream()
                    .filter(m -> m.getCreatedAt().isAfter(state.getDeletedAt()))
                    .toList();
        }

        return messages;
    }

    // =========================
    // XOÁ 1 CHIỀU (DELETE FOR ME)
    // =========================
    public Message deleteForMe(String messageId, Long userId) {

        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        msg.setDeletedBy(userId);

        // ❌ KHÔNG GỬI SOCKET Ở ĐÂY
        return messageRepository.save(msg);
    }

    // =========================
    // THU HỒI (DELETE FOR EVERYONE)
    // =========================
    public Message recallMessage(String messageId) {

        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        msg.setIsRecalled(true);
        msg.setContent(null);

        Message saved = messageRepository.save(msg);

        // ✅ gửi realtime cho cả 2 bên (GIỮ NGUYÊN)
        messagingTemplate.convertAndSend(
                "/topic/chat/" + msg.getRoomId() + "/recall",
                msg.getId()
        );

        return saved;
    }

    // =========================
    private String generateRoomId(Long a, Long b) {
        return (a < b) ? a + "_" + b : b + "_" + a;
    }

    public void deleteConversationForMe(String roomId, Long userId) {

        ConversationState state = conversationRepository
                .findByConversationKeyAndUserId(roomId, userId)
                .orElse(null);

        if (state == null) {
            state = ConversationState.builder()
                    .conversationKey(roomId)
                    .userId(userId)
                    .build();
        }

        state.setIsDeleted(true);
        state.setDeletedAt(LocalDateTime.now());

        conversationRepository.save(state);
    }
}