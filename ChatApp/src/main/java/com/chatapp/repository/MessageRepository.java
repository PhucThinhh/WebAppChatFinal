package com.chatapp.repository;

import com.chatapp.entity.Message;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface MessageRepository extends MongoRepository<Message, String>
{

    List<com.chatapp.entity.Message> findBySenderIdAndReceiverIdOrReceiverIdAndSenderId(
            Long senderId1, Long receiverId1,
            Long senderId2, Long receiverId2
    );

    List<Message> findByRoomIdOrderByCreatedAtAsc(String roomId);

    long countByRoomIdAndSenderIdNotAndCreatedAtAfterAndIsRecalledFalse(
            String roomId,
            Long senderId,
            LocalDateTime createdAt
    );

    List<Message> findBySenderIdOrReceiverIdOrderByCreatedAtDesc(
            Long senderId,
            Long receiverId
    );

    List<Message> findByRoomIdAndPinnedTrueOrderByPinnedAtDesc(String roomId);



}
