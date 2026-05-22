package com.mbem.immocam.module.admin.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminCreateVilleRequest {

    @NotBlank(message = "La ville est obligatoire")
    @Size(max = 100, message = "La ville doit contenir au maximum 100 caracteres")
    private String ville;
}
