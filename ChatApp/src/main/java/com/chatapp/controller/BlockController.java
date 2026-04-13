package com.chatapp.controller;

import com.chatapp.service.BlockedService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/block")
@RequiredArgsConstructor
public class BlockController {

    private final BlockedService service;

    private Long getCurrentUserId() {
        return Long.parseLong(
                SecurityContextHolder.getContext()
                        .getAuthentication()
                        .getName()
        );
    }

    @PostMapping("/{targetId}")
    public ResponseEntity<?> block(@PathVariable Long targetId) {
        service.block(getCurrentUserId(), targetId);
        return ResponseEntity.ok("Blocked");
    }

    @DeleteMapping("/{targetId}")
    public ResponseEntity<?> unblock(@PathVariable Long targetId) {
        service.unblock(getCurrentUserId(), targetId);
        return ResponseEntity.ok("Unblocked");
    }

    @GetMapping("/check/{targetId}")
    public ResponseEntity<Boolean> check(@PathVariable Long targetId) {
        return ResponseEntity.ok(
                service.isEitherBlocked(getCurrentUserId(), targetId)
        );
    }
}