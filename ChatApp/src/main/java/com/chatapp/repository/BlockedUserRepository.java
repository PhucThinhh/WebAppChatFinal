package com.chatapp.repository;

import com.chatapp.entity.BlockedUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BlockedUserRepository extends JpaRepository<BlockedUser, Long> {

    boolean existsByUserIdAndBlockedUserId(Long userId, Long blockedUserId);

    Optional<BlockedUser> findByUserIdAndBlockedUserId(Long userId, Long blockedUserId);
}