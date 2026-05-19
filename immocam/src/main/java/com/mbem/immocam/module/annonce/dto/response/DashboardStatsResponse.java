package com.mbem.immocam.module.annonce.dto.response;

import java.util.List;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DashboardStatsResponse {
    private int nombreAnnoncesActives;
    private int nombreAnnoncesTotal;
    private long nombreContactsTotal;
    private long nombreFavorisTotal;
    private long nombreVuesTotal;
    private List<AnnonceListResponse> annoncesExpirantBientot;
}