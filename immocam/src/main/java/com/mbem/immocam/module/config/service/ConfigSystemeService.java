package com.mbem.immocam.module.config.service;

import com.mbem.immocam.module.config.repository.ConfigSystemeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class ConfigSystemeService {

    private final ConfigSystemeRepository configRepository;
    private final Map<String, String> cache = new ConcurrentHashMap<>();
    private volatile long lastRefreshEpochMs = 0L;
    private static final long TTL_MS = 30_000L;

    public String getString(String cle, String valeurParDefaut) {
        refreshIfNeeded();
        return cache.getOrDefault(cle, valeurParDefaut);
    }

    public int getInt(String cle, int valeurParDefaut) {
        try {
            return Integer.parseInt(getString(cle, String.valueOf(valeurParDefaut)));
        } catch (NumberFormatException e) {
            return valeurParDefaut;
        }
    }

    public long getLong(String cle, long valeurParDefaut) {
        try {
            return Long.parseLong(getString(cle, String.valueOf(valeurParDefaut)));
        } catch (NumberFormatException e) {
            return valeurParDefaut;
        }
    }

    public void evictAll() {
        cache.clear();
        lastRefreshEpochMs = 0L;
    }

    private synchronized void refreshIfNeeded() {
        long now = Instant.now().toEpochMilli();
        if (now - lastRefreshEpochMs < TTL_MS && !cache.isEmpty()) {
            return;
        }
        cache.clear();
        configRepository.findAll().forEach(c -> cache.put(c.getCle(), c.getValeur()));
        lastRefreshEpochMs = now;
    }
}
