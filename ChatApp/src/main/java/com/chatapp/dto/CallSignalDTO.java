package com.chatapp.dto;

import lombok.Data;

@Data
public class CallSignalDTO {

    private String type;
    // CALL_OFFER, CALL_ANSWER, ICE_CANDIDATE, CALL_ACCEPT, CALL_REJECT, CALL_END

    private String roomId;

    private Long callerId;

    private Long receiverId;

    private String callerName;

    private String callerAvatar;

    private Object payload;
    // offer, answer, ice candidate
}