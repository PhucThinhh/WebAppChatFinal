package com.chatapp.repository;

import com.chatapp.entity.ConversationNickname;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface ConversationNicknameRepository
        extends MongoRepository<ConversationNickname, String> {

    Optional<ConversationNickname>
    findByConversationKeyAndOwnerUserIdAndTargetUserId(
            String conversationKey,
            Long ownerUserId,
            Long targetUserId
    );
}