package com.mbem.immocam.module.notification.repository;

import com.mbem.immocam.module.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findAllByOrderByDateCreationDesc(Pageable pageable);

    long countByLuFalse();

    @Modifying
    @Query("UPDATE Notification n SET n.lu = true WHERE n.lu = false")
    void marquerToutesCommeLues();
}
