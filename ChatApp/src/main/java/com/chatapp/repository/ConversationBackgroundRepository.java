package com.chatapp.repository;

import com.chatapp.entity.ConversationBackground;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ConversationBackgroundRepository
        extends JpaRepository<ConversationBackground, Long> {

    Optional<ConversationBackground> findByRoomId(String roomId);
}