package com.chatapp.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "message_reactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageReaction {

    @Id
    private String id;

    private String messageId;

    private String roomId;

    private Long userId;

    private String emoji;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}