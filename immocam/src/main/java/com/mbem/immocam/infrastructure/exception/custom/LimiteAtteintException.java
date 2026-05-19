package com.mbem.immocam.infrastructure.exception.custom;

/**
 * Limite métier atteinte (403).
 * Ex : propriétaire a atteint sa limite de 5 annonces actives.
 *
 * @author MBEMNOVA
 */
public class LimiteAtteintException extends RuntimeException {
    public LimiteAtteintException(String message) {
        super(message);
    }
}
