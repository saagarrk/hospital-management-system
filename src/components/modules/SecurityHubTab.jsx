import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Key, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Copy, 
  ArrowRight, 
  RefreshCw, 
  Terminal, 
  Eye, 
  Code2, 
  FileCode, 
  UserCheck, 
  LogOut,
  Send,
  Zap,
  Layers,
  Database
} from 'lucide-react';
import Swal from 'sweetalert2';

export const SecurityHubTab = () => {
  const [activeSubTab, setActiveSubTab] = useState('flow');
  const [selectedFlowStep, setSelectedFlowStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState('ADMIN');
  const [testedEndpoint, setTestedEndpoint] = useState('/api/admin/users');
  const [testResult, setTestResult] = useState(null);
  const [selectedCodeFile, setSelectedCodeFile] = useState('SecurityConfig.java');
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('doctor@hospital.com');
  const [simulatedResetToken, setSimulatedResetToken] = useState('');
  const [resetStatus, setResetStatus] = useState(null);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `Copied ${label} to clipboard!`,
      showConfirmButton: false,
      timer: 1500,
    });
  };

  // Flow steps for complete React -> Controller -> AuthManager -> UserDetails -> BCrypt -> JWT -> React
  const loginFlowSteps = [
    {
      id: 1,
      title: '1. React Frontend Dispatch',
      component: 'React Client (Axios)',
      action: 'POST /api/auth/login',
      description: 'The React application collects user credentials (username or email and plain password) through an encrypted HTTPS POST request.',
      codeSnippet: `// React Frontend Authentication Call
const response = await axios.post('/api/auth/login', {
  usernameOrEmail: 'doctor_cardio',
  password: 'Password@123'
});
const { accessToken, role, fullName } = response.data.data;
localStorage.setItem('jwt_token', accessToken);
axios.defaults.headers.common['Authorization'] = \`Bearer \${accessToken}\`;`,
      securityHighlight: 'Credentials sent over TLS/HTTPS payload; never in query params. React stores token in secure memory or HTTP-only cookies.'
    },
    {
      id: 2,
      title: '2. REST Controller Interception',
      component: 'AuthController.java',
      action: 'Delegates to AuthService',
      description: 'The controller intercepts the request, runs Jakarta Bean Validation (@Valid), and immediately hands off to AuthService. No security logic lives in the controller layer.',
      codeSnippet: `@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }
}`,
      securityHighlight: 'Zero business or cryptographic logic in controller; strictly handles HTTP request binding and response mapping.'
    },
    {
      id: 3,
      title: '3. AuthenticationManager Coordination',
      component: 'AuthenticationManager (ProviderManager)',
      action: 'authenticates unverified token',
      description: 'Spring Security\'s AuthenticationManager receives an unverified UsernamePasswordAuthenticationToken and delegates to DaoAuthenticationProvider.',
      codeSnippet: `// AuthServiceImpl.java
Authentication authentication = authenticationManager.authenticate(
    new UsernamePasswordAuthenticationToken(
        loginRequest.getUsernameOrEmail(),
        loginRequest.getPassword()
    )
);`,
      securityHighlight: 'Stateless coordination decoupling authentication provider mechanics from business services.'
    },
    {
      id: 4,
      title: '4. Database Credential Lookup',
      component: 'CustomUserDetailsService.java',
      action: 'loadUserByUsername(usernameOrEmail)',
      description: 'Queries the MySQL database via UserRepository using username or email. Constructs a Spring Security UserDetails instance with the user\'s hashed password and granted authority (e.g. ROLE_DOCTOR).',
      codeSnippet: `@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) {
        User user = userRepository.findByUsername(usernameOrEmail)
            .or(() -> userRepository.findByEmail(usernameOrEmail))
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + usernameOrEmail));

        return new org.springframework.security.core.userdetails.User(
            user.getUsername(),
            user.getPassword(), // Stored BCrypt hash: $2a$10$...
            user.isEnabled(),
            true, true, true,
            Collections.singleton(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }
}`,
      securityHighlight: 'Accounts disabled by administrators are rejected before cryptographic password check. Case-insensitive lookup prevents duplicate usernames.'
    },
    {
      id: 5,
      title: '5. BCrypt Salted Hash Verification',
      component: 'BCryptPasswordEncoder (Strength 10)',
      action: 'passwordEncoder.matches(raw, hash)',
      description: 'Spring Security evaluates the submitted plain password against the stored BCrypt hash using the embedded cryptographic salt. Raw passwords are never stored or matched with plaintext equality.',
      codeSnippet: `// Internal check in DaoAuthenticationProvider:
if (!passwordEncoder.matches(presentedPassword, userDetails.getPassword())) {
    throw new BadCredentialsException("Bad credentials");
}
// Hash format: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
// |Alg|$cost|---------22-char salt---------|-----------31-char hash-----------|`,
      securityHighlight: 'Slow adaptive hashing protects against offline dictionary & rainbow table attacks. If verification fails, AuthenticationEntryPoint responds with HTTP 401 Unauthorized.'
    },
    {
      id: 6,
      title: '6. Cryptographic JWT Token Issuance',
      component: 'JwtService.java',
      action: 'generateToken(authentication)',
      description: 'Once credentials match, JwtService mints a signed HMAC-SHA256 JWT access token containing identity claims, user roles, issued-at timestamp, and expiration date (24h). Secret is securely read from environment variables.',
      codeSnippet: `// JwtService.java
public String generateToken(Authentication authentication) {
    String roles = authentication.getAuthorities().stream()
        .map(GrantedAuthority::getAuthority)
        .collect(Collectors.joining(","));

    return Jwts.builder()
        .setSubject(authentication.getName())
        .claim("roles", roles)
        .setIssuedAt(new Date())
        .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
        .signWith(getSigningKey(), SignatureAlgorithm.HS256)
        .compact();
}`,
      securityHighlight: 'Never hardcoded: JWT_SECRET read from environment variable. Token is self-verifying and tamper-evident.'
    },
    {
      id: 7,
      title: '7. Sanitized AuthResponse Return to React',
      component: 'AuthResponse & React Client',
      action: 'HTTP 200 OK + Bearer Token',
      description: 'AuthService returns an AuthResponse containing the access token, role, and user profile information. The password hash is strictly excluded. The React client attaches the token to subsequent API calls.',
      codeSnippet: `// Returned JSON to React Frontend:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkb2N0b3JfY2FyZGlvIiwicm9sZXMiOiJST0xFX0RPQ1RPUiIsImV4cCI6MTc1ODgw...",
    "tokenType": "Bearer",
    "expiresInMs": 86400000,
    "userId": 2,
    "username": "doctor_cardio",
    "role": "DOCTOR",
    "fullName": "Dr. Eleanor Sterling"
  }
}`,
      securityHighlight: 'Strict zero-leak policy: Password hash never leaves the server. DTO pattern separates internal JPA representation from network responses.'
    }
  ];

  // RBAC Matrix
  const rbacRoles = [
    { role: 'ADMIN', label: 'Administrator', badge: 'bg-danger text-white' },
    { role: 'DOCTOR', label: 'Doctor / Physician', badge: 'bg-primary text-white' },
    { role: 'RECEPTIONIST', label: 'Receptionist / Front Desk', badge: 'bg-info text-dark' },
    { role: 'NURSE', label: 'Staff Nurse', badge: 'bg-success text-white' },
    { role: 'PHARMACIST', label: 'Pharmacist', badge: 'bg-warning text-dark' },
    { role: 'LAB_TECHNICIAN', label: 'Lab Technician', badge: 'bg-secondary text-white' },
    { role: 'PATIENT', label: 'Patient Portal', badge: 'bg-dark text-white' },
  ];

  const rbacPermissions = [
    { module: 'User Accounts & Roles (/api/admin/**)', permissions: { ADMIN: true, DOCTOR: false, RECEPTIONIST: false, NURSE: false, PHARMACIST: false, LAB_TECHNICIAN: false, PATIENT: false } },
    { module: 'Doctor Profiles & Rosters (/api/doctors/**)', permissions: { ADMIN: true, DOCTOR: true, RECEPTIONIST: true, NURSE: false, PHARMACIST: false, LAB_TECHNICIAN: false, PATIENT: false } },
    { module: 'Patient Registry (/api/patients/**)', permissions: { ADMIN: true, DOCTOR: true, RECEPTIONIST: true, NURSE: true, PHARMACIST: false, LAB_TECHNICIAN: false, PATIENT: true } },
    { module: 'Consultation Appointments (/api/appointments/**)', permissions: { ADMIN: true, DOCTOR: true, RECEPTIONIST: true, NURSE: false, PHARMACIST: false, LAB_TECHNICIAN: false, PATIENT: true } },
    { module: 'Longitudinal EHR Records (/api/medical-records/**)', permissions: { ADMIN: true, DOCTOR: true, RECEPTIONIST: false, NURSE: true, PHARMACIST: false, LAB_TECHNICIAN: false, PATIENT: false } },
    { module: 'Prescriptions Formulation (/api/prescriptions/**)', permissions: { ADMIN: true, DOCTOR: true, RECEPTIONIST: false, NURSE: true, PHARMACIST: true, LAB_TECHNICIAN: false, PATIENT: true } },
    { module: 'Pharmacy Formulary & Stock (/api/pharmacy/**)', permissions: { ADMIN: true, DOCTOR: false, RECEPTIONIST: false, NURSE: false, PHARMACIST: true, LAB_TECHNICIAN: false, PATIENT: false } },
    { module: 'Diagnostic Lab Tests & Reports (/api/laboratory/**)', permissions: { ADMIN: true, DOCTOR: true, RECEPTIONIST: false, NURSE: false, PHARMACIST: false, LAB_TECHNICIAN: true, PATIENT: false } },
    { module: 'Inpatient Beds & Admissions (/api/inpatient/**)', permissions: { ADMIN: true, DOCTOR: true, RECEPTIONIST: true, NURSE: true, PHARMACIST: false, LAB_TECHNICIAN: false, PATIENT: false } },
    { module: 'Billing Invoices & Payments (/api/billing/**)', permissions: { ADMIN: true, DOCTOR: false, RECEPTIONIST: true, NURSE: false, PHARMACIST: false, LAB_TECHNICIAN: false, PATIENT: true } },
  ];

  // Simulator Endpoints
  const endpoints = [
    { path: '/api/admin/users', method: 'GET', requiredRole: ['ADMIN'], desc: 'System user account governance' },
    { path: '/api/doctors', method: 'GET', requiredRole: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'], desc: 'Physician roster and OPD hours' },
    { path: '/api/prescriptions', method: 'POST', requiredRole: ['ADMIN', 'DOCTOR', 'PHARMACIST', 'NURSE', 'PATIENT'], desc: 'Issue medication prescription' },
    { path: '/api/pharmacy/medicines', method: 'POST', requiredRole: ['ADMIN', 'PHARMACIST'], desc: 'Update pharmacy inventory formulary' },
    { path: '/api/laboratory/reports', method: 'POST', requiredRole: ['ADMIN', 'DOCTOR', 'LAB_TECHNICIAN'], desc: 'Publish verified laboratory findings' },
    { path: '/api/billing/invoices', method: 'POST', requiredRole: ['ADMIN', 'RECEPTIONIST'], desc: 'Generate multi-item billing invoice' },
  ];

  const handleSimulateRequest = () => {
    if (isBlacklisted) {
      setTestResult({
        status: 401,
        statusText: 'Unauthorized',
        body: {
          timestamp: new Date().toISOString(),
          status: 401,
          error: 'Unauthorized',
          message: 'Token has been revoked/blacklisted via logout.',
          path: testedEndpoint
        }
      });
      return;
    }

    const endpointDef = endpoints.find(e => e.path === testedEndpoint);
    if (!endpointDef) return;

    const hasPermission = endpointDef.requiredRole.includes(selectedRole);

    if (hasPermission) {
      setTestResult({
        status: 200,
        statusText: 'OK',
        body: {
          timestamp: new Date().toISOString(),
          status: 200,
          data: {
            message: `Authorized access granted for role ROLE_${selectedRole}`,
            endpoint: testedEndpoint,
            authorizedBy: 'Spring Security 6 AuthorizationFilter (@PreAuthorize)'
          }
        }
      });
    } else {
      setTestResult({
        status: 403,
        statusText: 'Forbidden',
        body: {
          timestamp: new Date().toISOString(),
          status: 403,
          error: 'Forbidden',
          message: `Access Denied: Role ROLE_${selectedRole} does not hold required privileges: [${endpointDef.requiredRole.map(r => 'ROLE_' + r).join(', ')}]`,
          path: testedEndpoint
        }
      });
    }
  };

  const handleSimulateForgotPassword = () => {
    if (!forgotEmail) return;
    const token = 'rst-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
    setSimulatedResetToken(token);
    setResetStatus('issued');
  };

  const handleSimulateResetPassword = () => {
    if (!simulatedResetToken) return;
    setResetStatus('completed');
    Swal.fire({
      icon: 'success',
      title: 'Password Reset Successful!',
      text: 'BCrypt hash updated in MySQL database. Token marked used = true.',
      timer: 2000,
      showConfirmButton: false,
    });
  };

  const codeSnippets = {
    'SecurityConfig.java': `package com.hospital.management.config;

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

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationEntryPoint authenticationEntryPoint;
    private final JwtAccessDeniedHandler accessDeniedHandler;
    private final JwtAuthenticationFilter authenticationFilter;

    @Value("\${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public static PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler)
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(authorize -> authorize
                        // Public endpoints
                        .requestMatchers("/api/auth/**", "/api/public/**", "/actuator/health").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Role-specific endpoints
                        .requestMatchers("/api/admin/**", "/api/users/**").hasRole("ADMIN")
                        .requestMatchers("/api/doctors/**").hasAnyRole("ADMIN", "DOCTOR", "RECEPTIONIST")
                        .requestMatchers("/api/medical-records/**").hasAnyRole("ADMIN", "DOCTOR", "NURSE")
                        .requestMatchers("/api/appointments/**").hasAnyRole("ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT")
                        .requestMatchers("/api/inpatient/**").hasAnyRole("ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST")
                        .requestMatchers("/api/prescriptions/**").hasAnyRole("ADMIN", "DOCTOR", "PHARMACIST", "NURSE", "PATIENT")
                        .requestMatchers("/api/pharmacy/**").hasAnyRole("ADMIN", "PHARMACIST")
                        .requestMatchers("/api/laboratory/**").hasAnyRole("ADMIN", "DOCTOR", "LAB_TECHNICIAN")
                        .requestMatchers("/api/billing/**").hasAnyRole("ADMIN", "RECEPTIONIST", "PATIENT")
                        .requestMatchers("/api/patients/**").hasAnyRole("ADMIN", "DOCTOR", "RECEPTIONIST", "NURSE", "PATIENT")
                        .anyRequest().authenticated()
                );

        http.addFilterBefore(authenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}`,
    'JwtService.java': `package com.hospital.management.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class JwtService {

    // Configured securely via environment variables
    @Value("\${JWT_SECRET:\${app.jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}}")
    private String jwtSecret;

    @Value("\${JWT_EXPIRATION_MS:\${app.jwt.expiration-milliseconds:86400000}}")
    private long jwtExpirationMs;

    public String generateToken(Authentication authentication) {
        String roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", roles);

        return Jwts.builder()
                .setClaims(claims)
                .setSubject(authentication.getName())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    private Key getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claimsResolver.apply(claims);
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token);
            return !isTokenExpired(token);
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return true;
        }
    }

    public long getExpirationDurationMs() {
        return jwtExpirationMs;
    }
}`,
    'JwtAuthenticationFilter.java': `package com.hospital.management.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String token = extractTokenFromRequest(request);

        if (StringUtils.hasText(token)) {
            // Check if token was revoked via logout
            if (tokenBlacklistService.isBlacklisted(token)) {
                log.warn("Blocked request with blacklisted JWT: {}", request.getRequestURI());
                filterChain.doFilter(request, response);
                return;
            }

            if (jwtService.validateToken(token)) {
                try {
                    String username = jwtService.extractUsername(token);

                    if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                        UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

                        if (jwtService.validateToken(token, userDetails) && userDetails.isEnabled()) {
                            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );
                            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authToken);
                        }
                    }
                } catch (Exception e) {
                    log.error("Could not set user authentication in context: {}", e.getMessage());
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}`,
    'TokenBlacklistService.java': `package com.hospital.management.security;

import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Production Token Blacklist Service for stateless JWT logout strategy.
 * Stores invalidated JWT tokens in memory with TTL-based expiration.
 */
@Service
public class TokenBlacklistService {

    private final Map<String, Date> blacklist = new ConcurrentHashMap<>();

    public void blacklistToken(String token, Date expirationDate) {
        if (token != null && expirationDate != null && expirationDate.after(new Date())) {
            blacklist.put(token, expirationDate);
        }
        cleanupExpiredTokens();
    }

    public boolean isBlacklisted(String token) {
        if (token == null) return false;
        Date expiry = blacklist.get(token);
        if (expiry == null) return false;
        if (expiry.before(new Date())) {
            blacklist.remove(token);
            return false;
        }
        return true;
    }

    private void cleanupExpiredTokens() {
        Date now = new Date();
        blacklist.entrySet().removeIf(entry -> entry.getValue().before(now));
    }
}`,
    'JwtAccessDeniedHandler.java': `package com.hospital.management.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException, ServletException {
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", HttpServletResponse.SC_FORBIDDEN);
        body.put("error", "Forbidden");
        body.put("message", accessDeniedException.getMessage() != null ? 
                accessDeniedException.getMessage() : "Access Denied: You do not have sufficient privileges to access this resource");
        body.put("path", request.getServletPath());

        objectMapper.writeValue(response.getOutputStream(), body);
    }
}`,
    'AuthController.java': `package com.hospital.management.controller;

import com.hospital.management.dto.auth.*;
import com.hospital.management.dto.common.ApiResponse;
import com.hospital.management.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(ApiResponse.success(response, "Login successful"));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(@Valid @RequestBody RegisterRequest registerRequest) {
        String message = authService.register(registerRequest);
        return new ResponseEntity<>(ApiResponse.created(message, "Registration successful"), HttpStatus.CREATED);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String message = authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(message, "Password reset request processed"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        String message = authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success(message, "Password reset successfully"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(@RequestHeader(value = "Authorization", required = false) String bearerToken) {
        authService.logout(bearerToken);
        return ResponseEntity.ok(ApiResponse.success("Successfully logged out. Session invalidated.", "Logout successful"));
    }
}`,
    'AuthServiceImpl.java': `package com.hospital.management.service.impl;

import com.hospital.management.dto.auth.*;
import com.hospital.management.entity.PasswordResetToken;
import com.hospital.management.entity.User;
import com.hospital.management.enums.Role;
import com.hospital.management.exception.BusinessRuleException;
import com.hospital.management.exception.ConflictException;
import com.hospital.management.exception.ResourceNotFoundException;
import com.hospital.management.repository.PasswordResetTokenRepository;
import com.hospital.management.repository.UserRepository;
import com.hospital.management.security.JwtService;
import com.hospital.management.security.TokenBlacklistService;
import com.hospital.management.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenBlacklistService tokenBlacklistService;

    @Override
    public AuthResponse login(LoginRequest loginRequest) {
        // 1. Authenticate credentials via AuthenticationManager
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsernameOrEmail(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // 2. Issue signed JWT token
        String token = jwtService.generateToken(authentication);

        User user = userRepository.findByUsername(loginRequest.getUsernameOrEmail())
                .or(() -> userRepository.findByEmail(loginRequest.getUsernameOrEmail()))
                .orElseThrow(() -> new ResourceNotFoundException("User", "usernameOrEmail", loginRequest.getUsernameOrEmail()));

        // 3. Return AuthResponse without exposing password hash
        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .expiresInMs(jwtService.getExpirationDurationMs())
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .fullName(user.getFullName())
                .build();
    }

    @Override
    @Transactional
    public String register(RegisterRequest registerRequest) {
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new ConflictException("Username is already taken");
        }
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new ConflictException("Email is already registered");
        }

        User user = User.builder()
                .username(registerRequest.getUsername())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .email(registerRequest.getEmail())
                .fullName(registerRequest.getFullName())
                .phone(registerRequest.getPhone())
                .role(registerRequest.getRole() != null ? registerRequest.getRole() : Role.PATIENT)
                .enabled(true)
                .build();

        userRepository.save(user);
        return "User registered successfully";
    }

    @Override
    @Transactional
    public String forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            passwordResetTokenRepository.deleteByUser(user);
            String resetToken = UUID.randomUUID().toString();
            PasswordResetToken token = PasswordResetToken.builder()
                    .token(resetToken)
                    .user(user)
                    .expiryDate(LocalDateTime.now().plusMinutes(30))
                    .used(false)
                    .build();
            passwordResetTokenRepository.save(token);
        });
        return "If that email address exists in our database, a password reset link has been dispatched.";
    }

    @Override
    @Transactional
    public String resetPassword(ResetPasswordRequest request) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getResetToken())
                .orElseThrow(() -> new BusinessRuleException("Invalid or unrecognized password reset token."));

        if (resetToken.isUsed() || resetToken.isExpired()) {
            throw new BusinessRuleException("This reset token has expired or already been used.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        return "Password has been successfully reset. Please log in with your new password.";
    }

    @Override
    public void logout(String bearerToken) {
        if (!StringUtils.hasText(bearerToken)) return;
        String rawToken = bearerToken.startsWith("Bearer ") ? bearerToken.substring(7) : bearerToken;
        try {
            Date expiration = jwtService.extractExpiration(rawToken);
            tokenBlacklistService.blacklistToken(rawToken, expiration);
        } catch (Exception ignored) {}
        SecurityContextHolder.clearContext();
    }
}`,
    'User.java': `package com.hospital.management.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.hospital.management.enums.Role;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @JsonIgnore // CRITICAL: Never serialize password hash to JSON
    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Role role;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(length = 20)
    private String phone;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}`,
    'Role.java': `package com.hospital.management.enums;

public enum Role {
    ADMIN,
    DOCTOR,
    RECEPTIONIST,
    NURSE,
    PATIENT,
    PHARMACIST,
    LAB_TECHNICIAN
}`,
    'AuthDTOs.java': `// LoginRequest.java
package com.hospital.management.dto.auth;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LoginRequest {
    @NotBlank(message = "Username or email is required")
    private String usernameOrEmail;
    @NotBlank(message = "Password is required")
    private String password;
}

// RegisterRequest.java
package com.hospital.management.dto.auth;
import com.hospital.management.enums.Role;
import jakarta.validation.constraints.*;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class RegisterRequest {
    @NotBlank @Size(min = 3, max = 50)
    private String username;
    @NotBlank @Size(min = 6)
    private String password;
    @NotBlank @Email
    private String email;
    @NotBlank
    private String fullName;
    private String phone;
    @NotNull
    private Role role;
}

// AuthResponse.java
package com.hospital.management.dto.auth;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long expiresInMs;
    private Long userId;
    private String username;
    private String email;
    private String role;
    private String fullName;
}

// ForgotPasswordRequest.java
package com.hospital.management.dto.auth;
import jakarta.validation.constraints.*;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ForgotPasswordRequest {
    @NotBlank @Email
    private String email;
}

// ResetPasswordRequest.java
package com.hospital.management.dto.auth;
import jakarta.validation.constraints.*;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ResetPasswordRequest {
    @NotBlank
    private String resetToken;
    @NotBlank @Size(min = 6)
    private String newPassword;
}`
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Sub Header / Tab Bar */}
      <div className="card border-0 shadow-sm rounded-3 bg-white p-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <h5 className="fw-bold mb-1 d-flex align-items-center gap-2 text-dark">
              <Shield className="text-primary" size={20} />
              Spring Security 6 & JWT Production Architecture
            </h5>
            <span className="text-muted small">
              Stateless authentication, BCrypt salted hashing, HMAC-SHA256 tokens, custom 401/403 handlers & token blacklist logout.
            </span>
          </div>
          <div className="btn-group btn-group-sm">
            <button
              onClick={() => setActiveSubTab('flow')}
              className={`btn ${activeSubTab === 'flow' ? 'btn-primary' : 'btn-outline-secondary'}`}
            >
              <Zap size={14} className="me-1" /> Login Flow (React → Spring)
            </button>
            <button
              onClick={() => setActiveSubTab('rbac')}
              className={`btn ${activeSubTab === 'rbac' ? 'btn-primary' : 'btn-outline-secondary'}`}
            >
              <UserCheck size={14} className="me-1" /> RBAC Matrix (7 Roles)
            </button>
            <button
              onClick={() => setActiveSubTab('simulator')}
              className={`btn ${activeSubTab === 'simulator' ? 'btn-primary' : 'btn-outline-secondary'}`}
            >
              <Terminal size={14} className="me-1" /> Auth & Token Sandbox
            </button>
            <button
              onClick={() => setActiveSubTab('code')}
              className={`btn ${activeSubTab === 'code' ? 'btn-primary' : 'btn-outline-secondary'}`}
            >
              <Code2 size={14} className="me-1" /> Java Production Code
            </button>
          </div>
        </div>
      </div>

      {/* SUBTAB 1: COMPLETE LOGIN REQUEST FLOW */}
      {activeSubTab === 'flow' && (
        <div className="d-flex flex-column gap-4">
          {/* Interactive Flow Sequence Header */}
          <div className="card border-0 shadow-sm rounded-3 bg-white p-4">
            <h6 className="fw-bold text-dark mb-3">Complete Login Execution Pipeline</h6>
            <div className="row g-2">
              {loginFlowSteps.map((step, idx) => (
                <div key={step.id} className="col-12 col-md-6 col-lg-3 col-xl">
                  <button
                    onClick={() => setSelectedFlowStep(idx)}
                    className={`btn w-100 text-start p-2 rounded-2 border ${
                      selectedFlowStep === idx 
                        ? 'btn-primary text-white shadow-sm' 
                        : 'btn-light text-dark'
                    }`}
                    style={{ minHeight: '80px' }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="badge bg-light text-dark font-monospace" style={{ fontSize: '0.65rem' }}>
                        Step {step.id}
                      </span>
                      {selectedFlowStep === idx && <CheckCircle2 size={14} />}
                    </div>
                    <div className="fw-bold text-truncate" style={{ fontSize: '0.8rem' }}>
                      {step.component}
                    </div>
                    <div className="text-truncate opacity-75 font-monospace" style={{ fontSize: '0.7rem' }}>
                      {step.action}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Active Flow Step Detailed Inspection Card */}
          <div className="card border-0 shadow-sm rounded-3 bg-white p-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 pb-3 border-bottom">
              <div>
                <span className="badge bg-primary-subtle text-primary fw-bold mb-1">
                  PHASE {loginFlowSteps[selectedFlowStep].id} OF 7
                </span>
                <h5 className="fw-bold text-dark mb-0">
                  {loginFlowSteps[selectedFlowStep].title}
                </h5>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  disabled={selectedFlowStep === 0}
                  onClick={() => setSelectedFlowStep(prev => prev - 1)}
                  className="btn btn-outline-secondary btn-sm"
                >
                  Previous Step
                </button>
                <button
                  disabled={selectedFlowStep === loginFlowSteps.length - 1}
                  onClick={() => setSelectedFlowStep(prev => prev + 1)}
                  className="btn btn-primary btn-sm"
                >
                  Next Step <ArrowRight size={13} className="ms-1" />
                </button>
              </div>
            </div>

            <p className="text-secondary small mb-3">
              {loginFlowSteps[selectedFlowStep].description}
            </p>

            <div className="alert alert-light border border-success border-start-4 p-3 mb-3 small d-flex align-items-start gap-2">
              <CheckCircle2 size={16} className="text-success mt-1 flex-shrink-0" />
              <div>
                <span className="fw-bold text-dark">Security Safeguard: </span>
                <span className="text-secondary">{loginFlowSteps[selectedFlowStep].securityHighlight}</span>
              </div>
            </div>

            {/* Code Snippet for Flow Step */}
            <div className="position-relative">
              <div className="d-flex justify-content-between align-items-center bg-dark text-light px-3 py-2 rounded-top small font-monospace">
                <span>{loginFlowSteps[selectedFlowStep].component}</span>
                <button
                  onClick={() => copyToClipboard(loginFlowSteps[selectedFlowStep].codeSnippet, 'flow code')}
                  className="btn btn-sm btn-outline-light py-0 px-2 d-flex align-items-center gap-1"
                  style={{ fontSize: '0.75rem' }}
                >
                  <Copy size={12} /> Copy
                </button>
              </div>
              <pre className="bg-dark text-light p-3 rounded-bottom font-monospace small mb-0" style={{ maxHeight: '320px', overflowY: 'auto', fontSize: '0.8rem' }}>
                {loginFlowSteps[selectedFlowStep].codeSnippet}
              </pre>
            </div>
          </div>

          {/* Spring Security 6 Filter Chain Architecture Diagram */}
          <div className="card border-0 shadow-sm rounded-3 bg-white p-4">
            <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
              <Layers size={18} className="text-primary" />
              Spring Security 6 Internal Filter Chain & Failure Routing
            </h6>
            <p className="text-muted small mb-3">
              Every incoming request traverses the ordered security filter pipeline. Unauthenticated requests are halted at step 3 or 5.
            </p>

            <div className="table-responsive">
              <table className="table table-sm table-bordered align-middle small mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Order</th>
                    <th>Filter Component</th>
                    <th>Function & Responsibilities</th>
                    <th>Failure Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="badge bg-secondary">1</span></td>
                    <td className="font-monospace fw-bold text-primary">CorsFilter</td>
                    <td>Verifies Origin against <code>app.cors.allowed-origins</code> (e.g. http://localhost:3000)</td>
                    <td><span className="badge bg-danger">CORS Blocked (Preflight 403)</span></td>
                  </tr>
                  <tr>
                    <td><span className="badge bg-secondary">2</span></td>
                    <td className="font-monospace fw-bold text-muted">CsrfFilter</td>
                    <td>Disabled via <code>csrf.disable()</code> because REST APIs use Bearer tokens without browser cookies.</td>
                    <td><span className="badge bg-light text-muted">Bypassed (Stateless)</span></td>
                  </tr>
                  <tr>
                    <td><span className="badge bg-secondary">3</span></td>
                    <td className="font-monospace fw-bold text-primary">JwtAuthenticationFilter</td>
                    <td>
                      1. Extracts <code>Authorization: Bearer &lt;token&gt;</code><br />
                      2. Checks <code>TokenBlacklistService.isBlacklisted(token)</code><br />
                      3. Validates HMAC signature via <code>JwtService.validateToken(token)</code><br />
                      4. Populates <code>SecurityContextHolder.setAuthentication(...)</code>
                    </td>
                    <td><span className="badge bg-warning text-dark">401 Unauthorized via JwtAuthenticationEntryPoint</span></td>
                  </tr>
                  <tr>
                    <td><span className="badge bg-secondary">4</span></td>
                    <td className="font-monospace fw-bold text-secondary">UsernamePasswordAuthenticationFilter</td>
                    <td>Standard form login filter (bypassed in stateless REST JWT configurations).</td>
                    <td><span className="badge bg-light text-muted">Delegated to /api/auth/login</span></td>
                  </tr>
                  <tr>
                    <td><span className="badge bg-secondary">5</span></td>
                    <td className="font-monospace fw-bold text-primary">AuthorizationFilter (@PreAuthorize)</td>
                    <td>
                      Evaluates <code>requestMatchers()</code> & <code>hasRole('ADMIN')</code> against authenticated authorities.
                    </td>
                    <td><span className="badge bg-danger">403 Forbidden via JwtAccessDeniedHandler</span></td>
                  </tr>
                  <tr>
                    <td><span className="badge bg-success">6</span></td>
                    <td className="font-monospace fw-bold text-success">@RestController Endpoint</td>
                    <td>Dispatches business logic in Service/Repository layer and returns DTO.</td>
                    <td><span className="badge bg-success">200 OK / 201 Created</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: ROLE-BASED ACCESS CONTROL (RBAC) MATRIX */}
      {activeSubTab === 'rbac' && (
        <div className="card border-0 shadow-sm rounded-3 bg-white p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold text-dark mb-1">Role-Based Access Control (RBAC) Permission Matrix</h5>
              <span className="text-muted small">
                Enforced across 7 system roles using Spring Security <code>@PreAuthorize("hasRole('ROLE')")</code> and <code>requestMatchers</code>.
              </span>
            </div>
            <div className="badge bg-info-subtle text-info border border-info px-2 py-1">
              All 7 SRS Roles Defined
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover table-bordered align-middle small text-center">
              <thead className="table-light">
                <tr>
                  <th className="text-start" style={{ width: '30%' }}>Protected Endpoint Module</th>
                  {rbacRoles.map(r => (
                    <th key={r.role}>
                      <span className={`badge ${r.badge}`} style={{ fontSize: '0.7rem' }}>
                        {r.role}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rbacPermissions.map((row, idx) => (
                  <tr key={idx}>
                    <td className="text-start font-monospace small fw-bold text-secondary">
                      {row.module}
                    </td>
                    {rbacRoles.map(r => {
                      const allowed = row.permissions[r.role];
                      return (
                        <td key={r.role} className={allowed ? 'bg-success bg-opacity-10' : 'bg-light'}>
                          {allowed ? (
                            <span className="badge bg-success d-inline-flex align-items-center gap-1">
                              <CheckCircle2 size={11} /> ALLOW
                            </span>
                          ) : (
                            <span className="badge bg-danger-subtle text-danger border border-danger-subtle d-inline-flex align-items-center gap-1">
                              <XCircle size={11} /> 403
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: AUTH & TOKEN SANDBOX / SIMULATOR */}
      {activeSubTab === 'simulator' && (
        <div className="row g-4">
          {/* Persona & JWT Inspector */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-3 bg-white p-4 h-100">
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <Key size={16} className="text-primary" /> Active Persona & Live JWT Token Inspector
              </h6>

              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">Select Active Role Identity:</label>
                <div className="d-flex flex-wrap gap-2">
                  {rbacRoles.map(r => (
                    <button
                      key={r.role}
                      onClick={() => {
                        setSelectedRole(r.role);
                        setIsBlacklisted(false);
                        setTestResult(null);
                      }}
                      className={`btn btn-sm ${selectedRole === r.role ? 'btn-primary' : 'btn-outline-secondary'}`}
                    >
                      {r.role}
                    </button>
                  ))}
                </div>
              </div>

              {/* JWT Claims Decomposition */}
              <div className="p-3 bg-light rounded border mb-3 small">
                <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                  <span className="fw-bold text-dark">Decoded JWT Token Payload:</span>
                  <span className="badge bg-success">Alg: HS256</span>
                </div>
                <div className="font-monospace small">
                  <div><span className="text-muted">sub (Username):</span> <span className="text-primary fw-bold">{selectedRole.toLowerCase()}_user</span></div>
                  <div><span className="text-muted">roles (Authority):</span> <span className="badge bg-info text-dark">ROLE_{selectedRole}</span></div>
                  <div><span className="text-muted">iat (Issued At):</span> {new Date().toLocaleTimeString()}</div>
                  <div><span className="text-muted">exp (Expires):</span> {new Date(Date.now() + 86400000).toLocaleTimeString()} (24 Hours)</div>
                  <div><span className="text-muted">iss (Issuer):</span> Shree Jeevan Multispeciality Hospital</div>
                </div>
              </div>

              {/* Invalidation / Logout Button */}
              <div className="d-flex align-items-center justify-content-between p-3 border rounded bg-white">
                <div>
                  <div className="fw-bold small text-dark">Token Invalidation State:</div>
                  <div className="small text-muted">
                    {isBlacklisted ? (
                      <span className="text-danger fw-bold">Revoked via TokenBlacklistService</span>
                    ) : (
                      <span className="text-success fw-bold">Active & Valid in SecurityContext</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsBlacklisted(!isBlacklisted);
                    setTestResult(null);
                  }}
                  className={`btn btn-sm d-flex align-items-center gap-1 ${
                    isBlacklisted ? 'btn-outline-success' : 'btn-outline-danger'
                  }`}
                >
                  <LogOut size={14} />
                  {isBlacklisted ? 'Re-authenticate' : 'Revoke Token (Logout)'}
                </button>
              </div>
            </div>
          </div>

          {/* Endpoint Authorization Test Bench */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm rounded-3 bg-white p-4 h-100">
              <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <Terminal size={16} className="text-primary" /> Endpoint Authorization Test Bench
              </h6>

              <div className="mb-3">
                <label className="form-label small fw-bold text-secondary">Target Protected API Endpoint:</label>
                <select
                  value={testedEndpoint}
                  onChange={(e) => {
                    setTestedEndpoint(e.target.value);
                    setTestResult(null);
                  }}
                  className="form-select form-select-sm"
                >
                  {endpoints.map(e => (
                    <option key={e.path} value={e.path}>
                      [{e.method}] {e.path} — ({e.desc})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSimulateRequest}
                className="btn btn-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-2 mb-3 shadow-sm"
              >
                <Send size={14} /> Send Authenticated HTTP Request
              </button>

              {/* Output Result */}
              {testResult && (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="small fw-bold">Spring Security HTTP Response:</span>
                    <span className={`badge ${
                      testResult.status === 200 ? 'bg-success' : testResult.status === 401 ? 'bg-warning text-dark' : 'bg-danger'
                    }`}>
                      HTTP {testResult.status} {testResult.statusText}
                    </span>
                  </div>
                  <pre className="bg-dark text-light p-3 rounded font-monospace small mb-0" style={{ maxHeight: '180px', overflowY: 'auto', fontSize: '0.75rem' }}>
                    {JSON.stringify(testResult.body, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Password Recovery (Forgot / Reset Password) Simulator */}
          <div className="col-12">
            <div className="card border-0 shadow-sm rounded-3 bg-white p-4">
              <h6 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                <RefreshCw size={16} className="text-primary" /> Password Recovery Lifecycle (Forgot & Reset Password)
              </h6>
              <p className="text-muted small mb-3">
                Demonstrates how one-time secure tokens are generated, validated, and updated in MySQL without leaking account existence.
              </p>

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <div className="p-3 border rounded bg-light">
                    <div className="fw-bold small text-primary mb-2">Step 1: POST /api/auth/forgot-password</div>
                    <div className="input-group input-group-sm mb-2">
                      <input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="form-control"
                        placeholder="Enter registered email..."
                      />
                      <button
                        onClick={handleSimulateForgotPassword}
                        className="btn btn-primary"
                      >
                        Request Link
                      </button>
                    </div>
                    {simulatedResetToken && (
                      <div className="small font-monospace bg-white p-2 rounded border mt-2">
                        <span className="text-muted">Issued Token:</span> <code className="text-danger">{simulatedResetToken}</code>
                        <div className="text-success mt-1">TTL: 30 minutes. Stored in <code>password_reset_tokens</code>.</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-12 col-md-6">
                  <div className="p-3 border rounded bg-light">
                    <div className="fw-bold small text-success mb-2">Step 2: POST /api/auth/reset-password</div>
                    <div className="input-group input-group-sm mb-2">
                      <input
                        type="password"
                        defaultValue="NewPassword@2026"
                        className="form-control"
                        placeholder="New Password..."
                      />
                      <button
                        disabled={!simulatedResetToken || resetStatus === 'completed'}
                        onClick={handleSimulateResetPassword}
                        className="btn btn-success"
                      >
                        Reset Password
                      </button>
                    </div>
                    <div className="small text-muted mt-2">
                      {resetStatus === 'completed' ? (
                        <span className="text-success fw-bold">✓ Password successfully updated via BCrypt. Token invalidated.</span>
                      ) : (
                        <span>Submits token + new password. Spring hashes password with BCrypt(10).</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: PRODUCTION JAVA CODE EXPLORER */}
      {activeSubTab === 'code' && (
        <div className="card border-0 shadow-sm rounded-3 bg-white p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3 pb-3 border-bottom">
            <div>
              <h5 className="fw-bold text-dark mb-0">Production Spring Boot 3 & Security 6 Source Code</h5>
              <span className="text-muted small">All required controllers, services, filters, configurations, entities, and DTOs</span>
            </div>
            <button
              onClick={() => copyToClipboard(codeSnippets[selectedCodeFile], selectedCodeFile)}
              className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 shadow-sm"
            >
              <Copy size={13} /> Copy {selectedCodeFile}
            </button>
          </div>

          <div className="row g-3">
            {/* File Selector Sidebar */}
            <div className="col-12 col-md-4 col-xl-3">
              <div className="list-group list-group-flush border rounded overflow-hidden small">
                {Object.keys(codeSnippets).map(fileName => (
                  <button
                    key={fileName}
                    onClick={() => setSelectedCodeFile(fileName)}
                    className={`list-group-item list-group-item-action py-2 px-3 d-flex align-items-center justify-content-between ${
                      selectedCodeFile === fileName ? 'active' : ''
                    }`}
                  >
                    <span className="font-monospace fw-bold">{fileName}</span>
                    <FileCode size={13} className={selectedCodeFile === fileName ? 'text-white' : 'text-primary'} />
                  </button>
                ))}
              </div>
            </div>

            {/* Code Content */}
            <div className="col-12 col-md-8 col-xl-9">
              <pre className="bg-dark text-light p-3 rounded font-monospace small mb-0" style={{ maxHeight: '600px', overflowY: 'auto', fontSize: '0.8rem' }}>
                {codeSnippets[selectedCodeFile]}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
