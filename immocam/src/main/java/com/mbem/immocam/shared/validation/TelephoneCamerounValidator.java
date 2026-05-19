package com.mbem.immocam.shared.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * Validateur pour @TelephoneCameroun.
 * Accepte null (combiner avec @NotBlank si champ obligatoire).
 *
 * @author MBEMNOVA
 */
public class TelephoneCamerounValidator
        implements ConstraintValidator<TelephoneCameroun, String> {

    private static final String REGEX = "^\\+237[26][0-9]{8}$";

    @Override
    public void initialize(TelephoneCameroun constraintAnnotation) {}

    @Override
    public boolean isValid(String telephone, ConstraintValidatorContext context) {
        if (telephone == null || telephone.isBlank()) return true;
        return telephone.replaceAll("[\\s\\-().]+", "").matches(REGEX);
    }
}
