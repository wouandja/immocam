package com.mbem.immocam.shared.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Enveloppe standard pour toutes les reponses API ImmoCam.
 *
 * Format JSON :
 *   { "success": true, "message": "...", "data": {...}, "timestamp": "..." }
 *
 * Les champs null sont exclus (JsonInclude.NON_NULL).
 *
 * Usage :
 *   return ResponseEntity.ok(ApiResponse.ok("Annonce publiee", dto));
 *   return ResponseEntity.badRequest().body(ApiResponse.erreur("Invalide"));
 *
 * @param <T> Type de la donnee encapsulee
 * @author MBEMNOVA
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private T data;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    public static <T> ApiResponse<T> ok(String message, T data) {
        return ApiResponse.<T>builder()
                .success(true).message(message).data(data)
                .timestamp(LocalDateTime.now()).build();
    }

    public static <T> ApiResponse<T> ok(T data) {
        return ok(null, data);
    }

    /** Reponse succes sans data (ex : suppression reussie). */
    public static <T> ApiResponse<T> message(String message) {
        return ApiResponse.<T>builder()
                .success(true).message(message)
                .timestamp(LocalDateTime.now()).build();
    }

    public static <T> ApiResponse<T> erreur(String message) {
        return ApiResponse.<T>builder()
                .success(false).message(message)
                .timestamp(LocalDateTime.now()).build();
    }
}
