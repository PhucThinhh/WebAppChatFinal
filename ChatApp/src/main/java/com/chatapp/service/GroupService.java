package com.chatapp.service;

import com.chatapp.dto.CreateGroupDTO;
import com.chatapp.entity.Group;
import com.chatapp.entity.GroupMember;
import com.chatapp.repository.GroupMemberRepository;
import com.chatapp.repository.GroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

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

    public List<Group> getGroupsByUser(Long userId) {

        // 1. lấy danh sách membership
        List<GroupMember> members = memberRepo.findByUserId(userId);

        // 2. lấy danh sách groupId
        List<String> groupIds = members.stream()
                .map(GroupMember::getGroupId)
                .toList();

        // 3. lấy group từ DB
        return groupRepo.findAllById(groupIds);
    }

    public void addMember(String groupId, Long userId, Long currentUserId) {

        GroupMember me = memberRepo
                .findByGroupIdAndUserId(groupId, currentUserId)
                .orElseThrow(() -> new RuntimeException("Không thuộc nhóm"));

        if (!"ADMIN".equals(me.getRole()) && !"OWNER".equals(me.getRole())) {
            throw new RuntimeException("Không có quyền");
        }

        if (memberRepo.existsByGroupIdAndUserId(groupId, userId)) {
            throw new RuntimeException("User đã trong nhóm");
        }

        memberRepo.save(GroupMember.builder()
                .groupId(groupId)
                .userId(userId)
                .role("MEMBER")
                .build());
    }

    public List<GroupMember> getMembers(String groupId) {
        return memberRepo.findByGroupId(groupId);
    }

    public void removeMember(String groupId, Long targetUserId, Long currentUserId) {

        // 🔥 check người thực hiện có phải ADMIN không
        GroupMember me = memberRepo.findByGroupIdAndUserId(groupId, currentUserId)
                .orElseThrow(() -> new RuntimeException("Bạn không thuộc nhóm"));

        if (!"ADMIN".equals(me.getRole())) {
            throw new RuntimeException("Bạn không có quyền");
        }

        // ❌ không cho tự xóa chính mình (optional)
        if (currentUserId.equals(targetUserId)) {
            throw new RuntimeException("Không thể tự xoá chính mình");
        }

        // 🔥 check user tồn tại trong group
        GroupMember target = memberRepo.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new RuntimeException("User không trong nhóm"));

        memberRepo.deleteByGroupIdAndUserId(groupId, targetUserId);
    }

    public void deleteGroup(String groupId, Long currentUserId) {

        // 🔥 check group tồn tại
        Group group = groupRepo.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group không tồn tại"));

        // 🔥 chỉ creator mới được xoá
        if (!group.getCreatedBy().equals(currentUserId)) {
            throw new RuntimeException("Bạn không có quyền giải tán nhóm");
        }

        // 🔥 xoá toàn bộ member
        List<GroupMember> members = memberRepo.findByGroupId(groupId);
        memberRepo.deleteAll(members);

        // 🔥 xoá group
        groupRepo.deleteById(groupId);
    }
}