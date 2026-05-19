package com.mbem.immocam.infrastructure.exception.custom;

/**
 * Doublon détecté (409).
 * Ex : annonce similaire déjà publiée, email déjà utilisé.
 *
 * @author MBEMNOVA
 */
public class DoublonException extends RuntimeException {
    public DoublonException(String message) {
        super(message);
    }
}
