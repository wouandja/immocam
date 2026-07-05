package com.mbem.immocam.infrastructure.seo;

import com.mbem.immocam.module.annonce.repository.AnnonceRepository;
import com.mbem.immocam.shared.enums.StatutAnnonce;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.format.DateTimeFormatter;

/**
 * Génère un sitemap.xml dynamique incluant toutes les annonces actives.
 * Accessible via /api/sitemap.xml — nginx proxifie /sitemap.xml vers cet endpoint.
 */
@RestController
@RequiredArgsConstructor
public class SitemapController {

    private static final String BASE_URL = "https://bailocam.com";
    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE;

    private final AnnonceRepository annonceRepository;

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public String sitemap() {
        StringBuilder sb = new StringBuilder("""
                <?xml version="1.0" encoding="UTF-8"?>
                <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
                """);

        // Pages statiques
        appendUrl(sb, BASE_URL + "/",                        "daily",   "1.0", null);
        appendUrl(sb, BASE_URL + "/annonces",                "hourly",  "0.9", null);
        appendUrl(sb, BASE_URL + "/connexion",               "monthly", "0.5", null);
        appendUrl(sb, BASE_URL + "/inscription",             "monthly", "0.5", null);
        appendUrl(sb, BASE_URL + "/contact",                 "monthly", "0.4", null);
        appendUrl(sb, BASE_URL + "/conditions",              "yearly",  "0.2", null);
        appendUrl(sb, BASE_URL + "/politique-confidentialite","yearly", "0.2", null);
        appendUrl(sb, BASE_URL + "/mentions-legales",        "yearly",  "0.2", null);

        // Pages d'annonces actives (max 5 000 pour le sitemap)
        annonceRepository
            .findByStatutAndDeletedFalse(
                StatutAnnonce.ACTIVE,
                PageRequest.of(0, 5000, Sort.by(Sort.Direction.DESC, "dateCreation"))
            )
            .forEach(a -> {
                String lastmod = a.getDateModification() != null
                    ? a.getDateModification().format(ISO)
                    : a.getDateCreation().format(ISO);
                appendUrl(sb,
                    BASE_URL + "/annonces/" + a.getId(),
                    "weekly", "0.8", lastmod);
            });

        sb.append("</urlset>");
        return sb.toString();
    }

    private void appendUrl(StringBuilder sb, String loc, String changefreq,
                           String priority, String lastmod) {
        sb.append("  <url>\n");
        sb.append("    <loc>").append(loc).append("</loc>\n");
        if (lastmod != null) {
            sb.append("    <lastmod>").append(lastmod).append("</lastmod>\n");
        }
        sb.append("    <changefreq>").append(changefreq).append("</changefreq>\n");
        sb.append("    <priority>").append(priority).append("</priority>\n");
        sb.append("  </url>\n");
    }
}
