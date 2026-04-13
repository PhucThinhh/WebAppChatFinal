package com.chatapp.controller;

import com.chatapp.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;

    // =========================
    // XOÁ BOXCHAT 1 CHIỀU
    // =========================
    @DeleteMapping("/{partnerId}")
    public ResponseEntity<?> deleteConversation(
            @PathVariable Long partnerId,
            Principal principal) {

        Long userId = Long.parseLong(principal.getName());

        conversationService.deleteConversation(userId, partnerId);

        return ResponseEntity.ok(partnerId);
    }

    // =========================
    // RESTORE BOXCHAT
    // =========================
    @PutMapping("/restore/{partnerId}")
    public ResponseEntity<?> restoreConversation(
            @PathVariable Long partnerId,
            Principal principal) {

        Long userId = Long.parseLong(principal.getName());

        conversationService.restoreConversation(userId, partnerId);

        return ResponseEntity.ok(partnerId);
    }
}
