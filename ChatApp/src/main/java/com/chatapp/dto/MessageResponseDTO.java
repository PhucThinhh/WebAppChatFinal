package com.chatapp.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class MessageResponseDTO {

    private String id;

    private Long senderId;
    private Long receiverId;
    private String roomId;

    private String content;
    private String type;
    private String fileUrl;

    private Boolean isDeleted;
    private Boolean isRecalled;
    private LocalDateTime createdAt;

    private Long deletedBy;

    private Long originalSenderId;
    private String originalContent;
    private String originalMessageId;

    // Dùng để hiển thị trong group
    private String senderName;
    private String senderAvatar;

    private List<ReactionSummaryDTO> reactions;

    private Boolean pinned;

    private Long pinnedBy;

    private LocalDateTime pinnedAt;

    private String pollId;
}