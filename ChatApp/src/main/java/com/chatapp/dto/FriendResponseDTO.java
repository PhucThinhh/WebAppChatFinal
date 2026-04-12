package com.chatapp.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FriendResponseDTO {

    private Long friendshipId;

    private Long userId;
    private String username;
    private String avatar;

    private String status;
}
