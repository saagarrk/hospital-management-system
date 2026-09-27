package com.hospital.management.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

/**
 * Backward compatibility alias delegating to JwtService.
 */
@Component
public class JwtTokenProvider {

    private final JwtService jwtService;

    public JwtTokenProvider(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    public String generateToken(Authentication authentication) {
        return jwtService.generateToken(authentication);
    }

    public String getUsername(String token) {
        return jwtService.extractUsername(token);
    }

    public boolean validateToken(String token) {
        return jwtService.validateToken(token);
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        return jwtService.validateToken(token, userDetails);
    }
}
