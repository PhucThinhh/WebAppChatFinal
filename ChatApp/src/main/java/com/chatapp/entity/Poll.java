package com.chatapp.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "polls")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Poll {

    @Id
    private String id;

    private String roomId;

    private String question;

    private Long createdBy;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime expiresAt;

    @Builder.Default
    private Boolean closed = false;

    // Zalo nâng cao
    @Builder.Default
    private Boolean multipleChoice = false;

    @Builder.Default
    private Boolean allowAddOption = false;

    @Builder.Default
    private Boolean anonymous = false;

    @Builder.Default
    private Boolean hideResultUntilVoted = false;

    @Builder.Default
    private Boolean pinned = false;

    @Builder.Default
    private List<PollOption> options = new ArrayList<>();
}