package com.chatapp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserSearchDTO {
    private Long id;
    private String username;
    private String avatar;
    private String status; // FRIEND / PENDING / NONE
}
