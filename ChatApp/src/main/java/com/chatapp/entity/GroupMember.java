package com.chatapp.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "group_member")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupMember {

    @Id
    private String id;

    private String groupId;

    private Long userId;

    private GroupRole role;

    // false = vẫn còn trong nhóm
    // true = đã bị kick / đã rời nhóm
    @Builder.Default
    private Boolean removed = false;

    // thời điểm bị xoá khỏi nhóm
    private LocalDateTime removedAt;

    // ai xoá khỏi nhóm
    private Long removedBy;
}