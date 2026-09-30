package com.hospital.management.config;

import com.hospital.management.security.JwtAccessDeniedHandler;
import com.hospital.management.security.JwtAuthenticationEntryPoint;
import com.hospital.management.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Spring Security 6 Production Configuration.
 * Enforces stateless JWT authentication, fine-grained Role-Based Access Control (RBAC),
 * BCrypt password hashing, and custom 401/403 failure handling.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationEntryPoint authenticationEntryPoint;
    private final JwtAccessDeniedHandler accessDeniedHandler;
    private final JwtAuthenticationFilter authenticationFilter;

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOrigins;

    /**
     * BCrypt Password Encoder Bean with strength 10.
     * Guaranteed that raw passwords are never stored in persistence.
     */
    @Bean
    public static PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    /**
     * Expose AuthenticationManager from configuration
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    /**
     * Primary Security Filter Chain Configuration
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Enable CORS with custom configuration
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // Disable CSRF for stateless REST APIs using JWT Bearer authentication
                .csrf(csrf -> csrf.disable())
                // Custom 401 Unauthorized & 403 Forbidden failure handlers
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                )
                // Enforce stateless session management (no HTTP session cookies)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                // Role-Based URL Authorization Rules
                .authorizeHttpRequests(authorize -> authorize
                        // 1. Public Endpoints
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers("/actuator/health", "/error").permitAll()
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/swagger-resources/**",
                                "/webjars/**"
                        ).permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 2. Admin Only Endpoints
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/users/**").hasRole("ADMIN")

                        // 3. Clinical & Medical Consultations
                        .requestMatchers("/api/doctors/**").hasAnyRole("ADMIN", "DOCTOR", "RECEPTIONIST")
                        .requestMatchers("/api/medical-records/**").hasAnyRole("ADMIN", "DOCTOR", "NURSE")

                        // 4. Appointments & Reception
                        .requestMatchers("/api/appointments/**").hasAnyRole("ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT")

                        // 5. Inpatient, Wards & Admissions
                        .requestMatchers("/api/inpatient/**").hasAnyRole("ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST")

                        // 6. Prescriptions & Pharmacy
                        .requestMatchers("/api/prescriptions/**").hasAnyRole("ADMIN", "DOCTOR", "PHARMACIST", "NURSE", "PATIENT")
                        .requestMatchers("/api/pharmacy/**").hasAnyRole("ADMIN", "PHARMACIST")

                        // 7. Laboratory & Pathology
                        .requestMatchers("/api/laboratory/**", "/api/lab/**").hasAnyRole("ADMIN", "DOCTOR", "LAB_TECHNICIAN", "NURSE", "PATIENT")

                        // 8. Billing & Payments
                        .requestMatchers("/api/billing/**").hasAnyRole("ADMIN", "RECEPTIONIST", "PATIENT")

                        // 9. Patient Records
                        .requestMatchers("/api/patients/**").hasAnyRole("ADMIN", "DOCTOR", "RECEPTIONIST", "NURSE", "PATIENT")

                        // 10. Dashboard Aggregation APIs
                        .requestMatchers("/api/dashboard/**").authenticated()

                        // Catch-all: Any other request requires valid authentication
                        .anyRequest().authenticated()
                );

        // Position JWT filter before Spring's UsernamePasswordAuthenticationFilter
        http.addFilterBefore(authenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Cross-Origin Resource Sharing (CORS) Configuration Source
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        configuration.setAllowedOriginPatterns(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Disposition"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
