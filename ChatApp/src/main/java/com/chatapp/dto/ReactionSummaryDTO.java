package com.chatapp.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ReactionSummaryDTO {

    private String emoji;

    // Tổng số lần cảm xúc này được thả
    private long count;

    // Số lần user hiện tại đã thả cảm xúc này
    private long myCount;
}