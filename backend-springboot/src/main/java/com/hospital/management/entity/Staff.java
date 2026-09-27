package com.hospital.management.entity;

import com.hospital.management.enums.Role;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "staff")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Staff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(nullable = false, length = 100)
    private String position;

    @Column(name = "contact_number", nullable = false, length = 20)
    private String contactNumber;

    @Column(length = 100)
    private String email;

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String shift = "MORNING"; // MORNING, EVENING, NIGHT, ROTATIONAL

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE"; // ACTIVE, ON_LEAVE, INACTIVE
}
