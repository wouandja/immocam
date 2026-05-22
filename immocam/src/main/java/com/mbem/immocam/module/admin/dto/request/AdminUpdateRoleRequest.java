package com.mbem.immocam.module.admin.dto.request;

import com.mbem.immocam.shared.enums.RoleUtilisateur;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminUpdateRoleRequest {

    @NotNull(message = "Le role est obligatoire")
    private RoleUtilisateur role;
}
