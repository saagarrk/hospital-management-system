package com.hospital.management;

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

    public static void main(String[] args) {
        SpringApplication.run(HospitalManagementApplication.class, args);
        System.out.println("=================================================");
        System.out.println(" MedPulse Hospital Management System API Online ");
        System.out.println(" Connected to MySQL on port 8080                ");
        System.out.println("=================================================");
    }
}
