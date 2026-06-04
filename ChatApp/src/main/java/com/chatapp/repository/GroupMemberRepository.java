package com.chatapp.repository;

import com.chatapp.entity.GroupMember;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends MongoRepository<GroupMember, String> {

    // Lấy tất cả record của user, bao gồm cả đã bị xoá khỏi nhóm
    // Dùng để user bị kick vẫn thấy boxchat cũ
    List<GroupMember> findByUserId(Long userId);

    // Lấy tất cả member record của group, bao gồm cả removed
    List<GroupMember> findByGroupId(String groupId);

    // Tìm member kể cả đã removed
    Optional<GroupMember> findByGroupIdAndUserId(String groupId, Long userId);

    // Kiểm tra record tồn tại, kể cả removed
    boolean existsByGroupIdAndUserId(String groupId, Long userId);

    // Dùng cho giải tán nhóm hoặc trường hợp cần xoá thật
    void deleteByGroupIdAndUserId(String groupId, Long userId);

    // =========================
    // ACTIVE MEMBERS - CHƯA BỊ KICK
    // =========================

    // Lấy danh sách thành viên còn trong nhóm
    List<GroupMember> findByGroupIdAndRemovedFalse(String groupId);

    // Kiểm tra user còn đang trong nhóm hay không
    Optional<GroupMember> findByGroupIdAndUserIdAndRemovedFalse(
            String groupId,
            Long userId
    );

    // Check user còn active trong nhóm hay không
    boolean existsByGroupIdAndUserIdAndRemovedFalse(
            String groupId,
            Long userId
    );
}