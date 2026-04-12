package com.chatapp.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String phone;
    private String gender;
    private LocalDate birthday;
    private String avatar;
    private String coverImage;
    private String role;
}