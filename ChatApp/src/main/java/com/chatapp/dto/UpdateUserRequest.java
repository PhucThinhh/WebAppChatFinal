package com.chatapp.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateUserRequest {

    private String username;
    private String gender;
    private LocalDate birthday;

}