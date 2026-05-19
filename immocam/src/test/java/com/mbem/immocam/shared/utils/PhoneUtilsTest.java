package com.mbem.immocam.shared.utils;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Tests unitaires de PhoneUtils.
 *
 * @author MBEMNOVA
 */
class PhoneUtilsTest {

    @Test
    @DisplayName("Normalise un numéro à 9 chiffres")
    void normaliser_neufChiffres() {
        assertThat(PhoneUtils.normaliser("691234567")).isEqualTo("+237691234567");
    }

    @Test
    @DisplayName("Normalise un numéro avec 0 en tête")
    void normaliser_avecZero() {
        assertThat(PhoneUtils.normaliser("0691234567")).isEqualTo("+237691234567");
    }

    @Test
    @DisplayName("Conserve un numéro déjà au format international")
    void normaliser_dejaInternational() {
        assertThat(PhoneUtils.normaliser("+237691234567")).isEqualTo("+237691234567");
    }

    @ParameterizedTest
    @DisplayName("Normalise avec espaces et tirets")
    @ValueSource(strings = {"+237 691 234 567", "+237-691-234-567", "+237 691234567"})
    void normaliser_avecSeparateurs(String input) {
        assertThat(PhoneUtils.normaliser(input)).isEqualTo("+237691234567");
    }

    @Test
    @DisplayName("Lève une exception pour un format inconnu")
    void normaliser_formatInconnu_leveException() {
        assertThatThrownBy(() -> PhoneUtils.normaliser("12345"))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Construit un lien wa.me correct")
    void construireLienWhatsApp_retourneLienValide() {
        String lien = PhoneUtils.construireLienWhatsApp("+237691234567", "Bonjour test");
        assertThat(lien).startsWith("https://wa.me/237691234567?text=");
        assertThat(lien).doesNotContain("+237"); // le + est retiré pour wa.me
    }

    @Test
    @DisplayName("Masque correctement un numéro")
    void masquer_retourneNumeroPartiellementMasque() {
        String masque = PhoneUtils.masquer("+237691234567");
        assertThat(masque).isEqualTo("+237 *** **** 567");
        assertThat(masque).doesNotContain("234");
    }
}
