package com.chatapp.repository;

import com.chatapp.entity.ConversationState;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ConversationStateRepository
        extends MongoRepository<ConversationState, String> {

    Optional<ConversationState> findByConversationKeyAndUserId(
            String conversationKey,
            Long userId
    );

    boolean existsByConversationKeyAndUserIdAndIsDeletedTrue(
            String conversationKey,
            Long userId
    );
}
