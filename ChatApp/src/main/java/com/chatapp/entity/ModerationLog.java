package com.chatapp.entity;

import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "moderation_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModerationLog {

    @Id
    private String id;
    private Long userId;
    private String roomId;
    private String originalContent;
    private List<String> matchedWords;
    private String action;
    private Integer violationCount;
    private LocalDateTime mutedUntil;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
