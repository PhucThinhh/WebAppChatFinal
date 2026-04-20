package com.chatapp.controller;

import com.chatapp.dto.CreateGroupDTO;
import com.chatapp.entity.Group;
import com.chatapp.service.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/chat/group")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @PostMapping("/create")
    public Group create(@RequestBody CreateGroupDTO dto) {
        System.out.println(">>> CONTROLLER HIT");
        return groupService.createGroup(dto);
    }
}
