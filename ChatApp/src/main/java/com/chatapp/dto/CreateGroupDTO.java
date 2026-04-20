package com.chatapp.dto;

import lombok.Data;

import java.util.List;

@Data
public class CreateGroupDTO {

    private String name;

    private Long creatorId;

    private List<Long> memberIds;
}
