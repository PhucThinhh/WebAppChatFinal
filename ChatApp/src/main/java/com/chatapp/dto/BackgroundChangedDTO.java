package com.chatapp.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BackgroundChangedDTO {

    private String roomId;
    private String background;
    private String scope;
    private Long updatedBy;
    private String updatedByName;
}