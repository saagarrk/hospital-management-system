package com.hospital.management;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Hospital Management System (HMS)
 * Main Spring Boot Application
 */
@SpringBootApplication
@EnableScheduling
public class HospitalManagementApplication {

    private static final Logger log = LoggerFactory.getLogger(HospitalManagementApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(HospitalManagementApplication.class, args);
        log.info("MedPulse Hospital Management System REST API initialized successfully on port 8080.");
    }
}
