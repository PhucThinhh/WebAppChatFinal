package com.chatapp.mapper;

import com.chatapp.dto.FriendResponseDTO;
import com.chatapp.entity.Friendship;
import com.chatapp.entity.User;

public class FriendshipMapper {

    public static FriendResponseDTO toDTO(Friendship f, User u) {
        return FriendResponseDTO.builder()
                .friendshipId(f.getId())
                .userId(u.getId())
                .username(u.getUsername())
                .avatar(u.getAvatar())
                .status(f.getStatus().name())
                .build();
    }
}
