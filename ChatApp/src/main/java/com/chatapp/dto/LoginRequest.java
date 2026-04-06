package com.chatapp.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "SĐT không được để trống")
    private String phone;

    @NotBlank(message = "Mật khẩu không được để trống")
    private String password;
}