package com.chatapp.controller;

import com.chatapp.service.OnlineUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Set;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserStatusController {

    private final OnlineUserService onlineUserService;

    @GetMapping("/online")
    public Set<String> getOnlineUsers() {
        return onlineUserService.getOnlineUsers();
    }
}
