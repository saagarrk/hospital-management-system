package com.hospital.management.util;

public final class AppConstants {

    private AppConstants() {
        // Prevent instantiation
    }

    public static final String DEFAULT_PAGE_NUMBER = "0";
    public static final String DEFAULT_PAGE_SIZE = "10";
    public static final String DEFAULT_SORT_BY = "id";
    public static final String DEFAULT_SORT_DIRECTION = "asc";

    public static final String DATE_FORMAT = "yyyy-MM-dd";
    public static final String TIME_FORMAT = "HH:mm:ss";
    public static final String DATE_TIME_FORMAT = "yyyy-MM-dd HH:mm:ss";

    public static final String ROLE_ADMIN = "ROLE_ADMIN";
    public static final String ROLE_DOCTOR = "ROLE_DOCTOR";
    public static final String ROLE_RECEPTIONIST = "ROLE_RECEPTIONIST";
    public static final String ROLE_NURSE = "ROLE_NURSE";
    public static final String ROLE_PATIENT = "ROLE_PATIENT";
    public static final String ROLE_PHARMACIST = "ROLE_PHARMACIST";
    public static final String ROLE_LAB_TECHNICIAN = "ROLE_LAB_TECHNICIAN";
}
