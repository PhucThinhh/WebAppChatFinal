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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
    private final ToxicModerationService toxicModerationService;

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

        String textContent = dto.getContent() != null ? dto.getContent().trim() : "";
        boolean isTextMessage = dto.getType() == null || "TEXT".equalsIgnoreCase(dto.getType());
        boolean isAiCommand = textContent.startsWith("/ai");

        ToxicModerationService.ModerationResult moderation = ToxicModerationService.ModerationResult.allowed();
        if (isTextMessage && !isAiCommand) {
            moderation = toxicModerationService.moderate(dto.getSenderId(), roomId, textContent);
        }

        if (moderation.isBlocked()) {
            Message warning = Message.builder()
                    .id("violation-" + System.currentTimeMillis())
                    .senderId(dto.getSenderId())
                    .receiverId(dto.getReceiverId())
                    .roomId(roomId)
                    .content(moderation.getMessage())
                    .type("VIOLATION")
                    .createdAt(LocalDateTime.now())
                    .build();

            messagingTemplate.convertAndSend(
                    "/topic/chat/" + roomId + "/moderation/" + dto.getSenderId(),
                    warning
            );

            return null;
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
                .status("SENT")
                .seenBy(new ArrayList<>(List.of(dto.getSenderId())))
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
            messages = messages.stream()
                    .filter(m -> m.getCreatedAt().isAfter(state.getDeletedAt()))
                    .toList();
        }

        List<Message> seenUpdates = messages.stream()
                .filter(m -> m.getSenderId() != null)
                .filter(m -> !m.getSenderId().equals(userId))
                .filter(m -> !Boolean.TRUE.equals(m.getIsRecalled()))
                .filter(m -> m.getSeenBy() == null || !m.getSeenBy().contains(userId))
                .toList();

        if (!seenUpdates.isEmpty()) {
            seenUpdates.forEach(m -> {
                List<Long> seenBy = m.getSeenBy() == null ? new ArrayList<>() : new ArrayList<>(m.getSeenBy());
                seenBy.add(userId);
                m.setSeenBy(seenBy);
                m.setStatus("SEEN");
            });

            messageRepository.saveAll(seenUpdates);
            messagingTemplate.convertAndSend("/topic/chat/" + roomId + "/seen", seenUpdates);
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
    public Message recallMessage(String messageId, Long userId) {

        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (!msg.getSenderId().equals(userId)) {
            throw new RuntimeException("Bạn chỉ được thu hồi tin nhắn của mình");
        }

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

    public Message reactToMessage(String messageId, Long userId, String emoji) {
        Message msg = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));

        if (Boolean.TRUE.equals(msg.getIsRecalled())) {
            throw new RuntimeException("Không thể thả cảm xúc vào tin nhắn đã thu hồi");
        }

        String cleanEmoji = emoji == null ? "" : emoji.trim();
        if (cleanEmoji.isBlank()) {
            throw new RuntimeException("Emoji không hợp lệ");
        }

        Map<String, List<Long>> reactions = msg.getReactions();
        if (reactions == null) {
            reactions = new HashMap<>();
        }

        boolean sameReaction = reactions
                .getOrDefault(cleanEmoji, List.of())
                .stream()
                .anyMatch(id -> id.equals(userId));

        reactions.values().forEach(users -> users.removeIf(id -> id.equals(userId)));
        reactions.entrySet().removeIf(entry -> entry.getValue().isEmpty());

        if (!sameReaction) {
            reactions.computeIfAbsent(cleanEmoji, key -> new ArrayList<>()).add(userId);
        }

        msg.setReactions(reactions);
        Message saved = messageRepository.save(msg);

        messagingTemplate.convertAndSend(
                "/topic/chat/" + msg.getRoomId() + "/reaction",
                saved
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
