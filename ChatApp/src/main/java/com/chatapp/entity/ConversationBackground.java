package com.chatapp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "conversation_backgrounds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationBackground {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Ví dụ: 2_8 hoặc group_xxx
    @Column(nullable = false, unique = true)
    private String roomId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String background;

    private Long updatedBy;

    private LocalDateTime updatedAt;
}