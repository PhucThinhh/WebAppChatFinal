package com.chatapp.repository;

import com.chatapp.entity.MessageReaction;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MessageReactionRepository extends MongoRepository<MessageReaction, String> {

    List<MessageReaction> findByMessageId(String messageId);

    List<MessageReaction> findByMessageIdIn(List<String> messageIds);
    void deleteByMessageIdAndUserId(String messageId, Long userId);
}