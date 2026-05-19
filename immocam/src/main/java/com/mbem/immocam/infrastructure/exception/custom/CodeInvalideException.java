package com.mbem.immocam.infrastructure.exception.custom;

/**
 * Code OTP invalide, expiré ou déjà utilisé (400).
 *
 * @author MBEMNOVA
 */
public class CodeInvalideException extends RuntimeException {
    public CodeInvalideException(String message) {
        super(message);
    }
}
