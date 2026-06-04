package com.chatapp.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PrivateConversationDTO {

    private String id;
    private String type;
    private String name;
    private String avatar;
    private String roomId;
    private long unreadCount;

    // Thời gian tin nhắn mới nhất
    private LocalDateTime lastMessageAt;

    private TargetUserDTO targetUser;

    @Data
    @Builder
    public static class TargetUserDTO {
        private Long id;
        private String username;
        private String avatar;
    }
}