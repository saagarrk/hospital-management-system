package com.hospital.management.dto.user;

import com.hospital.management.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StaffDTO {
    private Long id;

    @NotBlank(message = "Staff employee ID is required")
    private String employeeId;

    @NotBlank(message = "Staff name is required")
    private String name;

    @NotNull(message = "Role is required")
    private Role role;

    private Long departmentId;
    private String departmentName;

    @NotBlank(message = "Phone number is required")
    private String phone;

    @Email(message = "Invalid email format")
    private String email;

    private LocalDate joiningDate;
    private BigDecimal salary;
    private String shiftTiming;
    private boolean active;
}
