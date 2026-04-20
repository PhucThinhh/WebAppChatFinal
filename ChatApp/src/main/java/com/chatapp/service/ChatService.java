package com.chatapp.service;

import com.chatapp.dto.SendMessageDTO;
import com.chatapp.entity.Message;
import com.chatapp.repository.ConversationStateRepository;
import com.chatapp.repository.GroupMemberRepository;
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
    private final GroupMemberRepository memberRepo;
    private final AIService aiService;

    // =========================
    // SEND MESSAGE
    // =========================
    public Message sendMessage(SendMessageDTO dto) {

        // 🔥 CHẶN NGAY
        if (blockedService.isEitherBlocked(dto.getSenderId(), dto.getReceiverId())) {
            System.out.println("🚫 BLOCKED MESSAGE");
            return null;
        }

        String roomId;

        if (dto.getRoomId() != null && dto.getRoomId().startsWith("group_")) {

            roomId = dto.getRoomId();
            String groupId = roomId.replace("group_", "");

            boolean isMember = memberRepo
                    .existsByGroupIdAndUserId(groupId, dto.getSenderId());

            if (!isMember) {
                throw new RuntimeException("Bạn không thuộc nhóm");
            }

        } else {
            roomId = generateRoomId(dto.getSenderId(), dto.getReceiverId());
        }

        // 🔥 SAVE USER MESSAGE
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

        Message saved = messageRepository.save(message);

        // 🔥 GỬI REALTIME USER
        messagingTemplate.convertAndSend(
                "/topic/chat/" + roomId,
                saved
        );

        // =========================
        // 🤖 AI: tin nhắn bắt đầu bằng "/ai" → gọi AIService, bot senderId = 0
        // =========================
        String textContent = dto.getContent() != null ? dto.getContent().trim() : "";
        if (textContent.startsWith("/ai")) {
            String question = textContent.length() > 3
                    ? textContent.substring(3).trim()
                    : "";

            if (question.isEmpty()) {
                question = "Hãy trả lời thân thiện bằng tiếng Việt";
            }

            String aiReply = aiService.askAI(question);

            Message botMsg = Message.builder()
                    .senderId(0L)
                    .roomId(roomId)
                    .content(aiReply)
                    .type("TEXT")
                    .createdAt(LocalDateTime.now())
                    .build();

            messageRepository.save(botMsg);

            messagingTemplate.convertAndSend(
                    "/topic/chat/" + roomId,
                    botMsg
            );
        }

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