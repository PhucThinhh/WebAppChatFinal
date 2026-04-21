package com.chatapp.controller;

import com.chatapp.dto.CreateGroupDTO;
import com.chatapp.dto.GroupMemberDTO;
import com.chatapp.entity.Group;
import com.chatapp.entity.GroupMember;
import com.chatapp.entity.GroupRole;
import com.chatapp.service.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat/group")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @PostMapping("/create")
    public Group create(@RequestBody CreateGroupDTO dto) {
        System.out.println(">>> CONTROLLER HIT");
        return groupService.createGroup(dto);
    }

    @GetMapping("/my-groups")
    public List<Group> getMyGroups(@RequestParam Long userId) {
        return groupService.getGroupsByUser(userId);
    }

    @PostMapping("/add-member")
    public void addMember(
            @RequestParam String groupId,
            @RequestParam Long userId,
            Authentication authentication
    ) {
        Long currentUserId = Long.parseLong(authentication.getName()); // ✅ OK vì sub = "2"

        groupService.addMember(groupId, userId, currentUserId);
    }

    @GetMapping("/members")
    public List<GroupMemberDTO> getMembers(@RequestParam String groupId) {
        return groupService.getMembers(groupId);
    }

    @DeleteMapping("/remove-member")
    public void removeMember(
            @RequestParam String groupId,
            @RequestParam Long userId,
            @RequestParam Long currentUserId
    ) {
        groupService.removeMember(groupId, userId, currentUserId);
    }

    @DeleteMapping("/delete")
    public void deleteGroup(
            @RequestParam String groupId,
            @RequestParam Long currentUserId
    ) {
        groupService.deleteGroup(groupId, currentUserId);
    }

    @PutMapping("/update-role")
    public void updateRole(
            @RequestParam String groupId,
            @RequestParam Long userId,
            @RequestParam GroupRole role, // 🔥 tự map enum
            @RequestParam Long currentUserId
    ) {
        groupService.updateRole(groupId, userId, role, currentUserId);
    }

    @DeleteMapping("/leave")
    public void leaveGroup(
            @RequestParam String groupId,
            @RequestParam Long userId
    ) {
        groupService.leaveGroup(groupId, userId);
    }
}
