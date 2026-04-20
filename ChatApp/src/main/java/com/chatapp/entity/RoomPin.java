package com.chatapp.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "room_pins")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomPin {

    @Id
    private String id;

    private String roomId;
    private String messageId;
}