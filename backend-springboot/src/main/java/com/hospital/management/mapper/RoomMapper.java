package com.hospital.management.mapper;

import com.hospital.management.dto.admission.BedResponse;
import com.hospital.management.dto.admission.RoomResponse;
import com.hospital.management.entity.Bed;
import com.hospital.management.entity.Room;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class RoomMapper {

    private final BedMapper bedMapper;

    public RoomResponse toResponse(Room room) {
        if (room == null) return null;

        List<Bed> beds = room.getBeds() != null ? room.getBeds() : Collections.emptyList();
        List<BedResponse> bedResponses = beds.stream()
                .map(bedMapper::toResponse)
                .collect(Collectors.toList());

        int total = beds.size();
        int available = (int) beds.stream().filter(b -> "AVAILABLE".equalsIgnoreCase(b.getStatus())).count();
        int occupied = (int) beds.stream().filter(b -> "OCCUPIED".equalsIgnoreCase(b.getStatus())).count();
        int maintenance = (int) beds.stream().filter(b -> "MAINTENANCE".equalsIgnoreCase(b.getStatus()) || "UNDER_MAINTENANCE".equalsIgnoreCase(b.getStatus())).count();
        int reserved = (int) beds.stream().filter(b -> "RESERVED".equalsIgnoreCase(b.getStatus())).count();

        return RoomResponse.builder()
                .id(room.getId())
                .roomNumber(room.getRoomNumber())
                .roomType(room.getRoomType())
                .floor(room.getFloor())
                .departmentId(room.getDepartmentId())
                .dailyRate(room.getDailyRate())
                .status(room.getStatus() != null ? room.getStatus() : "ACTIVE")
                .capacity(room.getCapacity() != null ? room.getCapacity() : 4)
                .totalBeds(total)
                .availableBeds(available)
                .occupiedBeds(occupied)
                .maintenanceBeds(maintenance)
                .reservedBeds(reserved)
                .beds(bedResponses)
                .build();
    }
}
