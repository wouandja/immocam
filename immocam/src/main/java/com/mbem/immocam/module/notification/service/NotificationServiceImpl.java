package com.mbem.immocam.module.notification.service;

import com.mbem.immocam.module.notification.dto.response.NotificationResponse;
import com.mbem.immocam.module.notification.entity.Notification;
import com.mbem.immocam.module.notification.repository.NotificationRepository;
import com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException;
import com.mbem.immocam.shared.enums.TypeNotification;
import com.mbem.immocam.shared.pagination.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * @author MBEMNOVA
 */
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;

    @Override
    @Transactional
    public void notifier(TypeNotification type, String titre, String message, String lien, Long referenceId) {
        Notification notification = Notification.builder()
                .type(type)
                .titre(titre)
                .message(message)
                .lien(lien)
                .referenceId(referenceId)
                .lu(false)
                .build();
        notificationRepository.save(notification);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> lister(Pageable pageable) {
        return PageResponse.from(notificationRepository.findAllByOrderByDateCreationDesc(pageable)
                .map(n -> NotificationResponse.builder()
                        .id(n.getId())
                        .type(n.getType().name())
                        .titre(n.getTitre())
                        .message(n.getMessage())
                        .lien(n.getLien())
                        .referenceId(n.getReferenceId())
                        .lu(n.isLu())
                        .dateCreation(n.getDateCreation())
                        .build()));
    }

    @Override
    @Transactional(readOnly = true)
    public long compterNonLues() {
        return notificationRepository.countByLuFalse();
    }

    @Override
    @Transactional
    public void marquerCommeLue(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RessourceNotFoundException("Notification", id));
        notification.setLu(true);
    }

    @Override
    @Transactional
    public void marquerToutesCommeLues() {
        notificationRepository.marquerToutesCommeLues();
    }
}
