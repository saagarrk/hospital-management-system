package com.hospital.management.security;

import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Production Token Blacklist Service for stateless JWT logout strategy.
 * Stores invalidated JWT tokens in memory with TTL-based expiration.
 * In a distributed multi-node production deployment, this can easily be backed by Redis.
 */
@Service
public class TokenBlacklistService {

    // Token -> Expiration Date
    private final Map<String, Date> blacklist = new ConcurrentHashMap<>();

    /**
     * Add token to blacklist until its natural expiration
     */
    public void blacklistToken(String token, Date expirationDate) {
        if (token != null && expirationDate != null && expirationDate.after(new Date())) {
            blacklist.put(token, expirationDate);
        }
        cleanupExpiredTokens();
    }

    /**
     * Check if a token is present in the blacklist
     */
    public boolean isBlacklisted(String token) {
        if (token == null) {
            return false;
        }
        Date expiry = blacklist.get(token);
        if (expiry == null) {
            return false;
        }
        // If the token has naturally expired, remove it and return false
        if (expiry.before(new Date())) {
            blacklist.remove(token);
            return false;
        }
        return true;
    }

    /**
     * Purge expired tokens to prevent memory leaks
     */
    private void cleanupExpiredTokens() {
        Date now = new Date();
        blacklist.entrySet().removeIf(entry -> entry.getValue().before(now));
    }
}
