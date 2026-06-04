package com.chatapp.repository;

import com.chatapp.entity.Poll;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PollRepository extends MongoRepository<Poll, String> {

    List<Poll> findByRoomIdOrderByCreatedAtDesc(String roomId);
}