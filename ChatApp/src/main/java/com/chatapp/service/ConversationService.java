package com.chatapp.service;

import com.chatapp.entity.ConversationState;
import com.chatapp.repository.ConversationStateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationStateRepository repo;

    // ===============================
    // tạo key chat ổn định 2 user
    // ===============================
    private String buildKey(Long u1, Long u2) {
        if (u1 == null || u2 == null) {
            throw new IllegalArgumentException("UserId cannot be null");
        }
        return (u1 < u2) ? u1 + "_" + u2 : u2 + "_" + u1;
    }

    // ===============================
    // XOÁ BOXCHAT 1 CHIỀU (HIDE INBOX)
    // ===============================
    public void deleteConversation(Long userId, Long partnerId) {

        String key = buildKey(userId, partnerId);

        ConversationState state = repo
                .findByConversationKeyAndUserId(key, userId)
                .orElse(ConversationState.builder()
                        .conversationKey(key)
                        .userId(userId)
                        .build());

        state.setIsDeleted(true);
        state.setDeletedAt(LocalDateTime.now());

        repo.save(state);
    }

    // ===============================
    // RESTORE BOXCHAT
    // ===============================
    public void restoreConversation(Long userId, Long partnerId) {

        String key = buildKey(userId, partnerId);

        repo.findByConversationKeyAndUserId(key, userId)
                .ifPresent(state -> {
                    state.setIsDeleted(false);
                    state.setDeletedAt(null);
                    repo.save(state);
                });
    }

    // ===============================
    // CHECK ẨN BOXCHAT (CHỈ DÙNG CHO INBOX UI)
    // ===============================
    public boolean isConversationHidden(String conversationKey, Long userId) {
        return repo.existsByConversationKeyAndUserIdAndIsDeletedTrue(
                conversationKey,
                userId
        );
    }
}
