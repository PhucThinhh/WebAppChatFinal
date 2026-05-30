package com.chatapp.service;

import com.chatapp.dto.CreateGroupDTO;
import com.chatapp.dto.GroupMemberDTO;
import com.chatapp.entity.Group;
import com.chatapp.entity.GroupMember;
import com.chatapp.entity.GroupRole;
import com.chatapp.entity.Message;
import com.chatapp.entity.User;
import com.chatapp.repository.GroupMemberRepository;
import com.chatapp.repository.GroupRepository;
import com.chatapp.repository.MessageRepository;
import com.chatapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Random;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepo;
    private final GroupMemberRepository memberRepo;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public Group createGroup(CreateGroupDTO dto) {

        // 🔥 CHECK MIN 3 NGƯỜI (creator + 2 member)
        if (dto.getMemberIds() == null || dto.getMemberIds().size() < 2) {
            throw new RuntimeException("Nhóm phải có ít nhất 3 thành viên");
        }

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

        // 2. thêm creator (OWNER)
        memberRepo.save(GroupMember.builder()
                .groupId(group.getId())
                .userId(dto.getCreatorId())
                .role(GroupRole.OWNER)
                .build());

        // 3. thêm member
        for (Long id : dto.getMemberIds()) {

            if (id.equals(dto.getCreatorId())) continue;

            memberRepo.save(GroupMember.builder()
                    .groupId(group.getId())
                    .userId(id)
                    .role(GroupRole.MEMBER)
                    .build());

            publishGroupSystemMessage(
                    group.getId(),
                    getDisplayName(id) + " đã được thêm vào nhóm bởi " + getDisplayName(dto.getCreatorId())
            );
        }

        publishGroupSystemMessage(
                group.getId(),
                getDisplayName(dto.getCreatorId()) + " đã tạo nhóm"
        );

        Set<Long> changedUsers = new HashSet<>();
        changedUsers.add(dto.getCreatorId());
        changedUsers.addAll(dto.getMemberIds());
        notifyGroupChanged(changedUsers, "GROUP_CREATED", group.getId());

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

        if (me.getRole() != GroupRole.ADMIN && me.getRole() != GroupRole.OWNER) {
            throw new RuntimeException("Không có quyền");
        }

        if (memberRepo.existsByGroupIdAndUserId(groupId, userId)) {
            throw new RuntimeException("User đã trong nhóm");
        }

        memberRepo.save(GroupMember.builder()
                .groupId(groupId)
                .userId(userId)
                .role(GroupRole.MEMBER)
                .build());

        publishGroupSystemMessage(
                groupId,
                getDisplayName(userId) + " đã được thêm vào nhóm bởi " + getDisplayName(currentUserId)
        );

        notifyGroupChanged(Set.of(userId), "GROUP_MEMBER_ADDED", groupId);
    }

    public List<GroupMemberDTO> getMembers(String groupId) {

        List<GroupMember> members = memberRepo.findByGroupId(groupId);
        if (members.isEmpty()) {
            return List.of();
        }

        List<Long> userIds = members.stream()
                .map(GroupMember::getUserId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<Long, User> userById = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return members.stream().map(m -> {
            Long uid = m.getUserId();
            User user = uid != null ? userById.get(uid) : null;

            return new GroupMemberDTO(
                    uid,
                    user != null ? user.getUsername() : "User " + uid,
                    user != null ? user.getAvatar() : "/default-avatar.png",
                    m.getRole().name()
            );
        }).toList();
    }

    public void removeMember(String groupId, Long targetUserId, Long currentUserId) {

        // 🔥 check người thực hiện có phải ADMIN không
        GroupMember me = memberRepo.findByGroupIdAndUserId(groupId, currentUserId)
                .orElseThrow(() -> new RuntimeException("Bạn không thuộc nhóm"));

        if (me.getRole() != GroupRole.ADMIN && me.getRole() != GroupRole.OWNER) {
            throw new RuntimeException("Bạn không có quyền");
        }

        // ❌ không cho tự xóa chính mình (optional)
        if (currentUserId.equals(targetUserId)) {
            throw new RuntimeException("Không thể tự xoá chính mình");
        }

        // 🔥 check user tồn tại trong group
        GroupMember target = memberRepo.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new RuntimeException("User không trong nhóm"));

        String targetName = getDisplayName(targetUserId);
        String actorName = getDisplayName(currentUserId);

        memberRepo.deleteByGroupIdAndUserId(groupId, targetUserId);

        publishGroupSystemMessage(
                groupId,
                targetName + " đã bị xóa khỏi nhóm bởi " + actorName
        );

        notifyGroupChanged(Set.of(targetUserId), "GROUP_MEMBER_REMOVED", groupId);
    }

    public void deleteGroup(String groupId, Long currentUserId) {

        // 🔥 check membership
        GroupMember me = memberRepo.findByGroupIdAndUserId(groupId, currentUserId)
                .orElseThrow(() -> new RuntimeException("Bạn không thuộc nhóm"));

        // 🔥 chỉ OWNER mới được xoá
        if (me.getRole() != GroupRole.OWNER) {
            throw new RuntimeException("Chỉ chủ nhóm mới được giải tán");
        }

        // 🔥 xoá member
        List<GroupMember> members = memberRepo.findByGroupId(groupId);
        Set<Long> notifyUsers = members.stream()
                .map(GroupMember::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        memberRepo.deleteAll(members);

        // 🔥 xoá group
        groupRepo.deleteById(groupId);

        notifyGroupChanged(notifyUsers, "GROUP_DELETED", groupId);
    }

    public void updateRole(String groupId, Long targetUserId, GroupRole newRole, Long currentUserId) {

        GroupMember me = memberRepo.findByGroupIdAndUserId(groupId, currentUserId)
                .orElseThrow(() -> new RuntimeException("Không thuộc nhóm"));

        if (me.getRole() != GroupRole.OWNER) {
            throw new RuntimeException("Không có quyền");
        }

        GroupMember target = memberRepo.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        if (target.getRole() == GroupRole.OWNER) {
            throw new RuntimeException("Không thể sửa OWNER");
        }

        target.setRole(newRole);
        memberRepo.save(target);
    }

    public void leaveGroup(String groupId, Long userId) {

        GroupMember me = memberRepo.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new RuntimeException("Không thuộc nhóm"));

        // 🔥 nếu là OWNER
        if (me.getRole() == GroupRole.OWNER) {

            List<GroupMember> members = memberRepo.findByGroupId(groupId);

            // ❗ chỉ còn 1 người → xoá nhóm
            if (members.size() <= 1) {
                Set<Long> notifyUsers = members.stream()
                        .map(GroupMember::getUserId)
                        .filter(Objects::nonNull)
                        .collect(Collectors.toSet());
                memberRepo.deleteAll(members);
                groupRepo.deleteById(groupId);
                notifyGroupChanged(notifyUsers, "GROUP_DELETED", groupId);
                return;
            }

            // 🔥 loại bỏ chính mình
            List<GroupMember> others = members.stream()
                    .filter(m -> !m.getUserId().equals(userId))
                    .toList();

            GroupMember newOwner;

            // ✅ ƯU TIÊN ADMIN
            List<GroupMember> admins = others.stream()
                    .filter(m -> m.getRole() == GroupRole.ADMIN)
                    .toList();

            if (!admins.isEmpty()) {
                // 👉 chọn random admin
                newOwner = admins.get(new Random().nextInt(admins.size()));
            } else {
                // 👉 không có admin → chọn random member
                newOwner = others.get(new Random().nextInt(others.size()));
            }

            // 🔥 set OWNER mới
            newOwner.setRole(GroupRole.OWNER);
            memberRepo.save(newOwner);
        }

        // 🔥 xoá user khỏi group
        memberRepo.deleteByGroupIdAndUserId(groupId, userId);
        publishGroupSystemMessage(
                groupId,
                getDisplayName(userId) + " đã rời nhóm"
        );
        notifyGroupChanged(Set.of(userId), "GROUP_MEMBER_REMOVED", groupId);
    }


    private void notifyGroupChanged(Set<Long> userIds, String action, String groupId) {
        if (userIds == null || userIds.isEmpty()) return;

        Map<String, Object> payload = new HashMap<>();
        payload.put("action", action);
        payload.put("groupId", groupId);
        payload.put("timestamp", System.currentTimeMillis());

        userIds.stream()
                .filter(Objects::nonNull)
                .forEach(uid ->
                        messagingTemplate.convertAndSend(
                                "/topic/group-updates/" + uid,
                                payload
                        )
                );
    }

    private String getDisplayName(Long userId) {
        if (userId == null) return "Người dùng";
        return userRepository.findById(userId)
                .map(User::getUsername)
                .filter(name -> name != null && !name.isBlank())
                .orElse("User " + userId);
    }

    private void publishGroupSystemMessage(String groupId, String text) {
        if (groupId == null || groupId.isBlank() || text == null || text.isBlank()) return;

        Message systemMsg = Message.builder()
                .senderId(0L)
                .roomId("group_" + groupId)
                .content(text)
                .type("SYSTEM")
                .createdAt(LocalDateTime.now())
                .build();

        Message saved = messageRepository.save(systemMsg);
        messagingTemplate.convertAndSend("/topic/chat/group_" + groupId, saved);
    }

}