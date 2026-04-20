package com.chatapp.repository;

import com.chatapp.entity.RoomPin;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface RoomPinRepository extends MongoRepository<RoomPin, String> {

    Optional<RoomPin> findByRoomId(String roomId);

    void deleteByRoomId(String roomId);
}