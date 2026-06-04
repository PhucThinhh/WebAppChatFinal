package com.chatapp.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "conversation_nicknames")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationNickname {

    @Id
    private String id;

    private String conversationKey; // roomId: 1_2

    private Long ownerUserId; // người đặt biệt danh

    private Long targetUserId; // người bị đặt biệt danh

    private String nickname;

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}