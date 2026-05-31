package com.chatapp.entity;

import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Document(collection = "messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    @Id
    private String id;

    private Long senderId;
    private Long receiverId;

    private String roomId;

    private String content;

    // TEXT | IMAGE | FILE | EMOJI
    private String type;

    private String fileUrl;

    @Builder.Default
    private Boolean isDeleted = false;

    @Builder.Default
    private Boolean isRecalled = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private Long deletedBy;

    private Long originalSenderId;

    private String originalContent;

    private String originalMessageId;

    private Map<String, List<Long>> reactions;

    private String status;

    private List<Long> seenBy;

}
