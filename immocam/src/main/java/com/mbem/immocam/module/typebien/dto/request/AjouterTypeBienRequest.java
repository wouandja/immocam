package com.mbem.immocam.module.typebien.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AjouterTypeBienRequest {

    @NotBlank(message = "Le libellé du type de bien est requis")
    @Size(max = 50, message = "Le libellé doit contenir au maximum 50 caractères")
    private String libelle;
}
