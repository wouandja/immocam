package com.mbem.immocam.infrastructure.storage.config;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

 
import lombok.extern.slf4j.Slf4j;

// WebMvcConfig.java
@Configuration
@Slf4j
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${immocam.storage.upload-dir:./uploads/annonces}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        // uploadDir = "./uploads/annonces"
        // On remonte au dossier parent "uploads/" pour tout servir
        Path uploadsRoot = Paths.get(uploadDir)
                .getParent()          // "./uploads/annonces" → "./uploads"
                .toAbsolutePath()
                .normalize();

        String location = "file:" + uploadsRoot.toString() + "/";

        log.info("📁 Serving static files from: {}", location);

        // Le context-path /api est déjà géré par Tomcat
        // Ici on déclare juste /uploads/**, Spring le résoudra en /api/uploads/**
        registry
            .addResourceHandler("/uploads/**")
            .addResourceLocations(location)
            .setCacheControl(
                CacheControl.maxAge(7, TimeUnit.DAYS).cachePublic()
            );
    }
}