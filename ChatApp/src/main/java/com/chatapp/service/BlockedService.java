package com.chatapp.service;

import com.chatapp.entity.BlockedUser;
import com.chatapp.repository.BlockedUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class BlockedService {

    private final BlockedUserRepository repo;

    public void block(Long userId, Long targetId) {
        if (repo.existsByUserIdAndBlockedUserId(userId, targetId)) return;

        repo.save(BlockedUser.builder()
                .userId(userId)
                .blockedUserId(targetId)
                .build());
    }

    public void unblock(Long userId, Long targetId) {
        repo.findByUserIdAndBlockedUserId(userId, targetId)
                .ifPresent(repo::delete);
    }

    // 🔥 check 2 chiều
    public boolean isEitherBlocked(Long a, Long b) {
        return repo.existsByUserIdAndBlockedUserId(a, b)
                || repo.existsByUserIdAndBlockedUserId(b, a);
    }
}