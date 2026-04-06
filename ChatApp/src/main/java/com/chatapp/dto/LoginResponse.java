package com.chatapp.dto;

import com.chatapp.entity.Role;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LoginResponse {
    private String token;
    private String username;
    private String phone;
    private String role;
}