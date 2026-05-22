package com.mbem.immocam.module.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminCreateTypeBienRequest {

    @NotBlank(message = "Le libelle est obligatoire")
    @Size(max = 50, message = "Le libelle doit contenir au maximum 50 caracteres")
    private String libelle;
}
