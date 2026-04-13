package com.chatapp.dto;

import lombok.Data;

@Data
public class SendMessageDTO {
    private Long senderId;
    private Long receiverId;
    private String content;
    private String type;
    private String fileUrl;
    private String roomId;
    private Long originalSenderId;
    private String originalContent;
    private String originalMessageId;


}
