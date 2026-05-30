package com.chatapp.repository;

import com.chatapp.entity.GroupMember;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends MongoRepository<GroupMember, String> {

    List<GroupMember> findByUserId(Long userId);
    List<GroupMember> findByGroupId(String groupId);

    boolean existsByGroupIdAndUserId(String groupId, Long userId); // 🔥 sửa ở đây

    Optional<GroupMember> findByGroupIdAndUserId(String groupId, Long userId);

    void deleteByGroupIdAndUserId(String groupId, Long userId);

}