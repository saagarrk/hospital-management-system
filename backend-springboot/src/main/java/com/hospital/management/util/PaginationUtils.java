package com.hospital.management.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Enterprise utility for parsing flexible pagination and sorting parameters.
 * Supports Spring standard ?sort=fieldName,desc as well as ?sortBy=fieldName&direction=desc.
 */
public final class PaginationUtils {

    private PaginationUtils() {}

    public static Pageable createPageable(int page, int size, String sort, String defaultSortBy, String defaultDirection) {
        int safePage = Math.max(0, page);
        int safeSize = (size <= 0) ? 10 : Math.min(size, 100);

        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String property = parts[0].trim();
            Sort.Direction direction = (parts.length > 1 && "desc".equalsIgnoreCase(parts[1].trim()))
                    ? Sort.Direction.DESC
                    : Sort.Direction.ASC;
            return PageRequest.of(safePage, safeSize, Sort.by(direction, property));
        }

        Sort.Direction direction = "desc".equalsIgnoreCase(defaultDirection) ? Sort.Direction.DESC : Sort.Direction.ASC;
        String property = (defaultSortBy != null && !defaultSortBy.isBlank()) ? defaultSortBy : "id";
        return PageRequest.of(safePage, safeSize, Sort.by(direction, property));
    }
}
