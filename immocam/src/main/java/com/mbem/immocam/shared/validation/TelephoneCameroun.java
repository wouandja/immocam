package com.mbem.immocam.shared.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation Bean Validation pour les numeros de telephone camerounais.
 * Valide le format : +237[26]XXXXXXXX
 *
 * Usage dans les DTOs :
 *   @TelephoneCameroun
 *   private String telephone;
 *
 * @author MBEMNOVA
 */
@Documented
@Constraint(validatedBy = TelephoneCamerounValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface TelephoneCameroun {
    String message() default "Numero camerounais invalide. Format : +237 6XX XXX XXX";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
