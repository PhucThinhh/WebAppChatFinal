package com.chatapp.controller;

import com.chatapp.dto.FriendRequestDTO;
import com.chatapp.dto.FriendResponseDTO;
import com.chatapp.dto.UserSearchDTO;
import com.chatapp.service.FriendshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendshipController {

    private final FriendshipService service;

    // ================== HELPER ==================
    private Long getCurrentUserId() {
        return Long.valueOf(
                SecurityContextHolder.getContext()
                        .getAuthentication()
                        .getName()
        );
    }

    // ================== API ==================

    // 🔥 GỬI LỜI MỜI
    @PostMapping("/request")
    public String send(@RequestBody FriendRequestDTO req) {

        Long senderId = getCurrentUserId();

        service.sendRequest(senderId, req.getReceiverId());

        return "Đã gửi lời mời";
    }

    // ✅ CHẤP NHẬN
    @PostMapping("/accept/{id}")
    public String accept(@PathVariable Long id) {
        service.accept(id);
        return "Đã chấp nhận";
    }

    // ❌ TỪ CHỐI
    @PostMapping("/reject/{id}")
    public String reject(@PathVariable Long id) {
        service.reject(id);
        return "Đã từ chối";
    }

    // 👥 DANH SÁCH BẠN
    @GetMapping
    public List<FriendResponseDTO> getFriends() {

        Long userId = getCurrentUserId();

        return service.getFriends(userId);
    }

    // 📩 DANH SÁCH LỜI MỜI
    @GetMapping("/requests")
    public List<FriendResponseDTO> getRequests() {

        Long userId = getCurrentUserId();

        return service.getRequests(userId);
    }

    // 🔍 TÌM KIẾM USER
    @GetMapping("/search")
    public List<UserSearchDTO> search(@RequestParam String keyword) {

        Long userId = getCurrentUserId();

        return service.searchUsers(keyword, userId);
    }
}