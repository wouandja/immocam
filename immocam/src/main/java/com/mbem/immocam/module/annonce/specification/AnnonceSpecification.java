package com.mbem.immocam.module.annonce.specification;

import com.mbem.immocam.module.annonce.entity.Annonce;
import com.mbem.immocam.shared.enums.StatutAnnonce;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Critères de recherche dynamique pour les annonces.
 *
 * Utilisé pour la barre de recherche (ville, type de bien, prix min/max).
 * Chaque critère est optionnel — seuls les filtres non-null sont appliqués.
 *
 * Usage dans AnnonceService :
 * Specification<Annonce> spec = AnnonceSpecification.filtrer(ville, typeBienId,
 * prixMin, prixMax);
 * Page<Annonce> page = annonceRepository.findAll(spec, pageable);
 *
 * @author MBEMNOVA
 */
public class AnnonceSpecification {

    private AnnonceSpecification() {
    }

    /**
     * Construit la specification de filtrage multicritères.
     *
     * @param ville      Ville (optionnel)
     * @param quartier   Quartier (optionnel)
     * @param typeBienId ID du type de bien (optionnel)
     * @param prixMin    Prix minimum en FCFA (optionnel)
     * @param prixMax    Prix maximum en FCFA (optionnel)
     * @return Specification combinant tous les critères actifs
     */
    public static Specification<Annonce> filtrer(
            String ville,
            String quartier,
            Long typeBienId,
            BigDecimal prixMin,
            BigDecimal prixMax) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Toujours filtrer sur les annonces actives, non supprimées et non expirées
            // (filet de sécurité en attendant le passage du scheduler de minuit)
            predicates.add(cb.equal(root.get("statut"), StatutAnnonce.ACTIVE));
            predicates.add(cb.equal(root.get("deleted"), false));
            predicates.add(cb.greaterThan(root.get("dateExpiration"), java.time.LocalDateTime.now()));

            if (ville != null && !ville.isBlank()) {
                predicates.add(cb.like(
                        cb.lower(root.get("localisation").get("ville")),
                        "%" + ville.toLowerCase().trim() + "%"));
            }

            if (quartier != null && !quartier.isBlank()) {
                predicates.add(cb.like(
                        cb.lower(root.get("quartier")),
                        "%" + quartier.toLowerCase().trim() + "%"));
            }

            if (typeBienId != null) {
                predicates.add(cb.equal(root.get("typeBien").get("id"), typeBienId));
            }

            if (prixMin != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("prix"), prixMin));
            }

            if (prixMax != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("prix"), prixMax));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Specification pour les annonces d'un propriétaire spécifique.
     * Utilisé dans le dashboard propriétaire avec filtres optionnels.
     *
     * @param proprietaireId ID du propriétaire
     * @param statut         Statut (optionnel, tous si null)
     * @return Specification
     */
    public static Specification<Annonce> parProprietaire(
            Long proprietaireId,
            StatutAnnonce statut) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("proprietaire").get("id"), proprietaireId));
            predicates.add(cb.equal(root.get("deleted"), false));
            if (statut != null) {
                predicates.add(cb.equal(root.get("statut"), statut));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Specification admin : toutes les annonces avec filtres multiples.
     *
     * @param ville          Ville (optionnel)
     * @param typeBienId     ID type bien (optionnel)
     * @param proprietaireId ID propriétaire (optionnel)
     * @param statut         Statut (optionnel)
     * @return Specification
     */
    public static Specification<Annonce> filtrerAdmin(
            String ville,
            Long typeBienId,
            Long proprietaireId,
            StatutAnnonce statut) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (ville != null && !ville.isBlank()) {
                predicates.add(cb.equal(
                        cb.lower(root.get("localisation").get("ville")),
                        ville.toLowerCase().trim()));
            }
            if (typeBienId != null) {
                predicates.add(cb.equal(root.get("typeBien").get("id"), typeBienId));
            }
            if (proprietaireId != null) {
                predicates.add(cb.equal(root.get("proprietaire").get("id"), proprietaireId));
            }
            if (statut != null) {
                predicates.add(cb.equal(root.get("statut"), statut));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
