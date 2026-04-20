package com.chatapp.service;

import com.chatapp.dto.CreateGroupDTO;
import com.chatapp.entity.Group;
import com.chatapp.entity.GroupMember;
import com.chatapp.repository.GroupMemberRepository;
import com.chatapp.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepo;
    private final GroupMemberRepository memberRepo;

    public Group createGroup(CreateGroupDTO dto) {

        // 1. tạo group
        Group group = groupRepo.save(
                Group.builder()
                        .name(dto.getName())
                        .createdBy(dto.getCreatorId())
                        .createdAt(LocalDateTime.now())
                        .build()
        );

        // 🔥 DEBUG QUAN TRỌNG
        if (group.getId() == null) {
            throw new RuntimeException("Group ID null - Mongo chưa generate");
        }

        // 2. thêm creator (ADMIN)
        memberRepo.save(GroupMember.builder()
                .groupId(group.getId())
                .userId(dto.getCreatorId())
                .role("ADMIN")
                .build());

        // 3. thêm member
        if (dto.getMemberIds() != null) {
            for (Long id : dto.getMemberIds()) {

                if (id.equals(dto.getCreatorId())) continue;

                memberRepo.save(GroupMember.builder()
                        .groupId(group.getId())
                        .userId(id)
                        .role("MEMBER")
                        .build());
            }
        }

        return group;
    }
}