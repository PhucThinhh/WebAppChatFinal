package com.chatapp.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ChatMessageResponseDTO {
    private String id;
    private Long senderId;
    private Long receiverId;
    private String content;
    private String type;
    private String fileUrl;
    private LocalDateTime createdAt;

}
