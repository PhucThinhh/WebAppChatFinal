package com.chatapp.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PollResponseDTO {

    private String id;

    private String roomId;

    private String question;

    private Long createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime expiresAt;

    private Boolean closed;

    private Boolean multipleChoice;

    private Boolean allowAddOption;

    private Boolean anonymous;

    private Boolean hideResultUntilVoted;

    private Boolean pinned;

    private Boolean votedByMe;

    private Integer totalVotes;

    private List<PollOptionResponseDTO> options;
}