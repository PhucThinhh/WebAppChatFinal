package com.chatapp.repository;

import com.chatapp.entity.Message;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface MessageRepository extends MongoRepository<com.chatapp.entity.Message, String> {

    List<com.chatapp.entity.Message> findBySenderIdAndReceiverIdOrReceiverIdAndSenderId(
            Long senderId1, Long receiverId1,
            Long senderId2, Long receiverId2
    );

    List<Message> findByRoomIdOrderByCreatedAtAsc(String roomId);

}
