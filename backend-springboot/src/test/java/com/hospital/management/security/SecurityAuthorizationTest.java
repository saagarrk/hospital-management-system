package com.hospital.management.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Security & Authorization (JWT & Token Blacklist) Tests")
class SecurityAuthorizationTest {

    private JwtService jwtService;
    private TokenBlacklistService tokenBlacklistService;

    // 256-bit secret key for HMAC-SHA256
    private static final String TEST_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
    private static final long TEST_EXPIRATION_MS = 3600000; // 1 hour

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "jwtSecret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", TEST_EXPIRATION_MS);

        tokenBlacklistService = new TokenBlacklistService();
    }

    @Test
    @DisplayName("Should generate valid signed JWT token and extract subject username")
    void generateAndExtractUsername_Success() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "dr_house",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_DOCTOR"))
        );

        String token = jwtService.generateToken(auth);

        assertThat(token).isNotBlank();
        String username = jwtService.extractUsername(token);
        assertThat(username).isEqualTo("dr_house");

        Date expiration = jwtService.extractExpiration(token);
        assertThat(expiration).isAfter(new Date());
    }

    @Test
    @DisplayName("Should validate token against matching UserDetails")
    void validateToken_MatchingUserDetails_ReturnsTrue() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "nurse_jackie",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_NURSE"))
        );

        String token = jwtService.generateToken(auth);

        UserDetails userDetails = User.withUsername("nurse_jackie")
                .password("password")
                .authorities("ROLE_NURSE")
                .build();

        boolean isValid = jwtService.validateToken(token, userDetails);
        assertThat(isValid).isTrue();
    }

    @Test
    @DisplayName("Should reject token when validated against a different user")
    void validateToken_MismatchedUserDetails_ReturnsFalse() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "user_alice",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_PATIENT"))
        );

        String token = jwtService.generateToken(auth);

        UserDetails otherUser = User.withUsername("user_bob")
                .password("password")
                .authorities("ROLE_PATIENT")
                .build();

        boolean isValid = jwtService.validateToken(token, otherUser);
        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("Should blacklist token upon logout and correctly verify blacklist status")
    void tokenBlacklist_Success() {
        String token = "sample.blacklisted.jwt.token";
        Date futureExpiry = new Date(System.currentTimeMillis() + 60000);

        assertThat(tokenBlacklistService.isTokenBlacklisted(token)).isFalse();

        tokenBlacklistService.blacklistToken(token, futureExpiry);

        assertThat(tokenBlacklistService.isTokenBlacklisted(token)).isTrue();
    }
}
