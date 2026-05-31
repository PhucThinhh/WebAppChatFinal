package com.chatapp.entity;

import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "call_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CallHistory {

    @Id
    private String id;

    private Long callerId;
    private Long receiverId;
    private String roomId;
    private String type;
    private String status;
    private Long duration;
    private LocalDateTime startedAt;
    private LocalDateTime answeredAt;
    private LocalDateTime endedAt;
}
