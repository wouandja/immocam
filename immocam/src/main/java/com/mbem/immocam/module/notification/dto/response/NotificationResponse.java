package com.mbem.immocam.module.notification.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private String type;
    private String titre;
    private String message;
    private String lien;
    private Long referenceId;
    private boolean lu;
    private LocalDateTime dateCreation;
}
