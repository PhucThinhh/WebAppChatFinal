package com.chatapp.entity;

import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "conversation_state")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationState {

    @Id
    private String id;

    private String conversationKey;
    private Long userId;

    @Builder.Default
    private Boolean isDeleted = false;

    private LocalDateTime deletedAt;

    // Đánh dấu user đã đọc tới thời điểm nào
    private LocalDateTime lastReadAt;

    private String background;
}