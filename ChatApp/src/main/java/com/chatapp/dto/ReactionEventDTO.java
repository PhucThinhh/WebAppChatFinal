package com.chatapp.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ReactionEventDTO {

    private String messageId;

    private String roomId;

    private Long userId;

    private String username;

    private String emoji;

    private List<ReactionSummaryDTO> reactions;
}