package com.mbem.immocam.module.notification.service;

import com.mbem.immocam.module.notification.dto.response.NotificationResponse;
import com.mbem.immocam.shared.enums.TypeNotification;
import com.mbem.immocam.shared.pagination.PageResponse;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    /** Crée une notification admin (signalement, inscription, ...). */
    void notifier(TypeNotification type, String titre, String message, String lien, Long referenceId);

    PageResponse<NotificationResponse> lister(Pageable pageable);

    long compterNonLues();

    void marquerCommeLue(Long id);

    void marquerToutesCommeLues();
}
