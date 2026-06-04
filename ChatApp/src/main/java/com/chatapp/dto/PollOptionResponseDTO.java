package com.chatapp.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PollOptionResponseDTO {

    private String id;

    private String text;

    private Long createdBy;

    private LocalDateTime createdAt;

    private Integer voteCount;

    private Boolean votedByMe;

    private List<PollVoterDTO> voters;
}