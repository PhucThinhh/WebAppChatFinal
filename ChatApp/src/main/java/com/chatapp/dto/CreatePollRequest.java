package com.chatapp.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class CreatePollRequest {

    private String roomId;

    private String question;

    private List<String> options;

    // Cho phép chọn nhiều phương án
    private Boolean multipleChoice;

    // Cho phép thêm lựa chọn
    private Boolean allowAddOption;

    // Ẩn người bình chọn
    private Boolean anonymous;

    // Ẩn kết quả khi chưa bình chọn
    private Boolean hideResultUntilVoted;

    // Ghim lên đầu trò chuyện
    private Boolean pinned;

    // Thời hạn bình chọn
    private LocalDateTime expiresAt;
}