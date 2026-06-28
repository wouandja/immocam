package com.mbem.immocam.module.localisation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuartierResponse {
    private Long id;
    private String nom;
    private String ville;
}
