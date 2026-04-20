package com.chatapp.repository;

import com.chatapp.entity.GroupMember;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface GroupMemberRepository extends MongoRepository<GroupMember, String> {

    List<GroupMember> findByUserId(Long userId);

    boolean existsByGroupIdAndUserId(String groupId, Long userId); // 🔥 sửa ở đây
}