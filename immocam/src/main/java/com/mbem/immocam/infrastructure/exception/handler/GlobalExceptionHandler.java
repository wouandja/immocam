package com.mbem.immocam.infrastructure.exception.handler;

import com.mbem.immocam.infrastructure.exception.custom.AccesRefuseException;
import com.mbem.immocam.infrastructure.exception.custom.CodeInvalideException;
import com.mbem.immocam.infrastructure.exception.custom.CompteBloqueException;
import com.mbem.immocam.infrastructure.exception.custom.DoublonException;
import com.mbem.immocam.infrastructure.exception.custom.LimiteAtteintException;
import com.mbem.immocam.infrastructure.exception.custom.RessourceNotFoundException;
import com.mbem.immocam.shared.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.HashMap;
import java.util.Map;

/**
 * Gestionnaire global des exceptions.
 *
 * Toutes les exceptions remontées jusqu'à la couche controller sont
 * interceptées ici et transformées en réponses JSON structurées ApiResponse.
 *
 * Ne jamais exposer les stack traces en production (configuré dans application.yaml).
 *
 * @author MBEMNOVA
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ── Exceptions métier ImmoCam ─────────────────────────────────────────

    @ExceptionHandler(RessourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ApiResponse<Void> handleNotFound(RessourceNotFoundException ex) {
        return ApiResponse.erreur(ex.getMessage());
    }

    @ExceptionHandler(AccesRefuseException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleAccesRefuse(AccesRefuseException ex) {
        return ApiResponse.erreur(ex.getMessage());
    }

    @ExceptionHandler(LimiteAtteintException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleLimite(LimiteAtteintException ex) {
        return ApiResponse.erreur(ex.getMessage());
    }

    @ExceptionHandler(DoublonException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ApiResponse<Void> handleDoublon(DoublonException ex) {
        return ApiResponse.erreur(ex.getMessage());
    }

    @ExceptionHandler(CodeInvalideException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleCodeInvalide(CodeInvalideException ex) {
        return ApiResponse.erreur(ex.getMessage());
    }

    @ExceptionHandler(CompteBloqueException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleCompteBloque(CompteBloqueException ex) {
        return ApiResponse.erreur(ex.getMessage());
    }

    // ── Exceptions Spring Security ────────────────────────────────────────

    @ExceptionHandler(BadCredentialsException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ApiResponse<Void> handleBadCredentials(BadCredentialsException ex) {
        return ApiResponse.erreur("Email ou mot de passe incorrect.");
    }

    @ExceptionHandler(DisabledException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleDisabled(DisabledException ex) {
        return ApiResponse.erreur(ex.getMessage());
    }

    @ExceptionHandler(LockedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleLocked(LockedException ex) {
        return ApiResponse.erreur(ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ApiResponse<Void> handleAccessDenied(AccessDeniedException ex) {
        return ApiResponse.erreur("Accès non autorisé.");
    }

    // ── Validation Bean Validation ────────────────────────────────────────

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> erreurs = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String champ = ((FieldError) error).getField();
            erreurs.put(champ, error.getDefaultMessage());
        });
        ApiResponse<Map<String, String>> response = new ApiResponse<>();
        response.setSuccess(false);
        response.setMessage("Données invalides");
        response.setData(erreurs);
        return response;
    }

    // ── Upload photos ─────────────────────────────────────────────────────

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.PAYLOAD_TOO_LARGE)
    public ApiResponse<Void> handleMaxSize(MaxUploadSizeExceededException ex) {
        return ApiResponse.erreur("La photo dépasse la taille maximale autorisée (4 Mo).");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ApiResponse<Void> handleIllegalArgument(IllegalArgumentException ex) {
        return ApiResponse.erreur(ex.getMessage());
    }

    // ── Erreur générique ──────────────────────────────────────────────────

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ApiResponse<Void> handleGeneral(Exception ex) {
        log.error("Erreur inattendue", ex);
        return ApiResponse.erreur("Une erreur est survenue. Veuillez réessayer.");
    }
}
