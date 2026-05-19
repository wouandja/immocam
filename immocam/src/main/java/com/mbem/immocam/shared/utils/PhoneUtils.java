package com.mbem.immocam.shared.utils;

/**
 * Utilitaires pour les numeros de telephone camerounais.
 *
 * Normalise tout numero au format international +237XXXXXXXXX
 * avant stockage en base de donnees.
 *
 * @author MBEMNOVA
 */
public final class PhoneUtils {

    private PhoneUtils() {}

    /**
     * Normalise un numero camerounais au format international.
     *
     * Exemples :
     *   "691234567"     -> "+237691234567"
     *   "0691234567"    -> "+237691234567"
     *   "+237691234567" -> "+237691234567" (inchange)
     *
     * @param telephone Numero brut saisi
     * @return Numero normalise +237XXXXXXXXX
     * @throws IllegalArgumentException si format non reconnu
     */
    public static String normaliser(String telephone) {
        if (telephone == null || telephone.isBlank()) {
            throw new IllegalArgumentException("Numero de telephone vide");
        }
        String n = telephone.replaceAll("[\\s\\-().]+", "");
        if (n.startsWith("+237")) return n;
        if (n.startsWith("0") && n.length() == 10) return "+237" + n.substring(1);
        if (n.length() == 9) return "+237" + n;
        throw new IllegalArgumentException(
            "Format non reconnu : " + telephone + ". Utilisez +237 6XX XXX XXX");
    }

    /**
     * Construit un lien WhatsApp click-to-chat.
     *
     * SECURITE : Le numero n'est JAMAIS expose dans l'API.
     * Il est integre uniquement dans ce lien wa.me (protection contre le scraping).
     *
     * @param telephone        Numero proprietaire (+237XXXXXXXXX)
     * @param messagePreRempli Message a pre-remplir
     * @return Lien wa.me complet avec message encode
     */
    public static String construireLienWhatsApp(String telephone, String messagePreRempli) {
        String num = telephone.replace("+", "");
        String msg = messagePreRempli
            .replace(" ", "%20")
            .replace("\n", "%0A")
            .replace(":", "%3A");
        return "https://wa.me/" + num + "?text=" + msg;
    }

    /**
     * Masque un numero pour l'affichage (dashboard proprietaire).
     * Exemple : "+237691234567" -> "+237 *** **** 567"
     *
     * @param telephone Numero complet
     * @return Numero partiellement masque
     */
    public static String masquer(String telephone) {
        if (telephone == null || telephone.length() < 4) return "***";
        return "+237 *** **** " + telephone.substring(telephone.length() - 3);
    }
}
