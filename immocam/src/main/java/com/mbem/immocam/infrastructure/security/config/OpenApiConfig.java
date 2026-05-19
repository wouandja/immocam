package com.mbem.immocam.infrastructure.security.config;



import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration Swagger/OpenAPI 3.
 * Permet d'entrer le token JWT directement dans l'UI Swagger
 * sans passer par Postman.
 *
 * Usage : cliquer sur le bouton "Authorize" en haut à droite,
 * entrer : Bearer <votre_token>
 *
 * @author MBEMNOVA
 */
@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                // ✅ Applique le schéma Bearer à TOUS les endpoints par défaut
                .addSecurityItem(new SecurityRequirement()
                        .addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .name(SECURITY_SCHEME_NAME)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Entrer le token JWT. " +
                                                "Exemple : eyJhbGciOiJIUzI1NiJ9...")))
                .info(new Info()
                        .title("ImmoCam API")
                        .version("1.0.0")
                        .description("API REST immobilière ImmoCam — Cameroun")
                        .contact(new Contact()
                                .name("MBEMNOVA")
                                .email("contact@immocam.cm")));
    }
}