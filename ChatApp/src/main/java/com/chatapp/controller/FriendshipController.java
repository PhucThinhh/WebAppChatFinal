package com.chatapp.controller;

import com.chatapp.dto.FriendRequestDTO;
import com.chatapp.dto.FriendResponseDTO;
import com.chatapp.entity.User;
import com.chatapp.repository.UserRepository;
import com.chatapp.service.FriendshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import com.chatapp.dto.UserSearchDTO;


import java.util.List;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
public class FriendshipController {

    private final FriendshipService service;
    private final UserRepository userRepository;

    // ================== HELPER ==================
    private String getCurrentUserPhone() {
        return SecurityContextHolder.getContext()
                .getAuthentication()
                .getName(); // sub trong token = phone
    }

    private Long getCurrentUserId() {
        String phone = getCurrentUserPhone();

        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return user.getId();
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

    // 👥 DANH SÁCH BẠN (KHÔNG CẦN userId)
    @GetMapping
    public List<FriendResponseDTO> getFriends() {

        Long userId = getCurrentUserId();

        return service.getFriends(userId);
    }

    // 📩 DANH SÁCH LỜI MỜI (KHÔNG CẦN userId)
    @GetMapping("/requests")
    public List<FriendResponseDTO> getRequests() {

        Long userId = getCurrentUserId();

        return service.getRequests(userId);
    }

    @GetMapping("/search")
    public List<UserSearchDTO> search(@RequestParam String keyword) {

        Long userId = getCurrentUserId();

        return service.searchUsers(keyword, userId);
    }

}
