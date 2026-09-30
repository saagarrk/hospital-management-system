package com.hospital.management.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

/**
 * Enterprise OpenAPI 3.0 / Swagger Specification Configuration.
 * Configures interactive API exploration, JWT Bearer security schemes,
 * contact info, server targets, and domain tags for MedPulse Hospital Management System.
 */
@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "bearerAuth";

    @Value("${server.servlet.context-path:/}")
    private String contextPath;

    @Bean
    public OpenAPI hospitalManagementOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("MedPulse Hospital Management System REST API")
                        .description("Production-grade Spring Boot 3.2 enterprise healthcare backend API. " +
                                "Implements fine-grained Role-Based Access Control (RBAC), stateless JWT Bearer security, " +
                                "Jakarta Bean Validation, declarative Spring Data JPA repositories with MySQL persistence, " +
                                "and sanitized global exception handling.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Hospital Backend Engineering Team")
                                .email("backend-engineering@medpulse-hospital.in")
                                .url("https://medpulse-hospital.in"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://www.apache.org/licenses/LICENSE-2.0")))
                .servers(List.of(
                        new Server().url(contextPath).description("Current Environment Server"),
                        new Server().url("http://localhost:8080").description("Local Development Server")
                ))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME, new SecurityScheme()
                                .name(SECURITY_SCHEME_NAME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Enter your JWT token obtained from `/api/auth/login` to authenticate requests.")))
                .tags(Arrays.asList(
                        new Tag().name("Authentication").description("JWT token generation, login, registration, password recovery, and token refresh"),
                        new Tag().name("Patients").description("Patient registration, EMR profile lifecycle, demographic updates, and medical history summary"),
                        new Tag().name("Doctors").description("Doctor directory, department affiliations, specialties, OPD consultation fees, and schedule slots"),
                        new Tag().name("Appointments").description("OPD consultations, conflict-free scheduling, status lifecycle transitions, and cancellations"),
                        new Tag().name("Medical Records").description("Doctor clinical notes, ICD-10 diagnoses, vital signs observations, and immutable revision audits"),
                        new Tag().name("Prescriptions").description("Medication orders, dosage schedules, dispensing authorization, and pharmacy fulfillment"),
                        new Tag().name("Pharmacy").description("Inventory tracking, medicine batch expiration monitoring, stock reorders, and stock transactions"),
                        new Tag().name("Laboratory").description("Pathology/radiology test orders, sample collection tracking, technician assignment, and diagnostic reports"),
                        new Tag().name("Admissions & Inpatient").description("IPD bed allocation, room telemetry, ward transfers, and clinical discharge summaries"),
                        new Tag().name("Billing & Payments").description("Consolidated invoicing, itemized line items, GST calculations, and multi-mode payment settlements"),
                        new Tag().name("Dashboard & Analytics").description("Role-tailored clinical aggregations, occupancy metrics, revenue indicators, and queue telemetry"),
                        new Tag().name("Users & Staff").description("User directory, role assignment, account status management, and credential updates"),
                        new Tag().name("Audit Logs").description("HIPAA/NABH compliant regulatory audit trail capturing all system mutations")
                ));
    }
}
