package com.chatapp.repository;

import com.chatapp.entity.ModerationLog;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface ModerationLogRepository extends MongoRepository<ModerationLog, String> {

    long countByUserIdAndCreatedAtAfter(Long userId, LocalDateTime createdAt);

    Optional<ModerationLog> findTopByUserIdAndActionAndMutedUntilAfterOrderByMutedUntilDesc(
            Long userId,
            String action,
            LocalDateTime mutedUntil
    );
}
