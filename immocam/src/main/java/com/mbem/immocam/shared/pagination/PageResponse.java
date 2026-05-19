package com.mbem.immocam.shared.pagination;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Reponse paginee standard pour toutes les listes ImmoCam.
 *
 * Usage :
 *   Page<AnnonceResponse> page = service.lister(pageable);
 *   return ResponseEntity.ok(ApiResponse.ok(PageResponse.from(page)));
 *
 * Le champ dernierePage = true signifie au frontend d'arreter le scroll infini.
 *
 * @param <T> Type des elements
 * @author MBEMNOVA
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {

    private List<T> contenu;
    private int     pageActuelle;
    private int     taillePage;
    private long    totalElements;
    private int     totalPages;
    private boolean dernierePage;
    private boolean premierePage;

    public static <T> PageResponse<T> from(Page<T> page) {
        return PageResponse.<T>builder()
                .contenu(page.getContent())
                .pageActuelle(page.getNumber())
                .taillePage(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .dernierePage(page.isLast())
                .premierePage(page.isFirst())
                .build();
    }
}
