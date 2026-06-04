package com.chatapp.dto;

import lombok.Data;

@Data
public class UpdateNicknameRequest {

    private String roomId;

    private Long targetUserId;

    private String nickname;
}