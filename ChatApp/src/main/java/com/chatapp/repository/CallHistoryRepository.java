package com.chatapp.repository;

import com.chatapp.entity.CallHistory;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CallHistoryRepository extends MongoRepository<CallHistory, String> {

    List<CallHistory> findByRoomIdOrderByStartedAtDesc(String roomId);
}
