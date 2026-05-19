package com.mbem.immocam.module.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Requête de renouvellement du token d'accès via le refresh token.
 *
 * @author MBEMNOVA
 */
@Data
public class RefreshTokenRequest {

    @NotBlank(message = "Le refresh token est obligatoire")
    private String refreshToken;
}
