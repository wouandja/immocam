package com.mbem.immocam.module.localisation.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AjouterQuartierRequest {

    @NotBlank(message = "La ville est obligatoire")
    private String ville;

    @NotBlank(message = "Le quartier est obligatoire")
    @Size(min = 2, max = 100, message = "Le quartier doit comporter entre 2 et 100 caractères")
    private String quartier;
}
