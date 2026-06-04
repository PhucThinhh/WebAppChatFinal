package com.chatapp.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PollVoterDTO {

    private Long id;

    private String username;

    private String avatar;
}