package com.barodap.controller;

import com.barodap.dto.ComplaintCreateDto;
import com.barodap.dto.ComplaintResponseDto;
import com.barodap.service.ComplaintProcessingService;
import com.barodap.service.PostgresService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final PostgresService postgresService;
    private final ComplaintProcessingService processingService;

    public ComplaintController(PostgresService postgresService,
                               ComplaintProcessingService processingService) {
        this.postgresService = postgresService;
        this.processingService = processingService;
    }

    // 민원 접수
    @PostMapping
    public ResponseEntity<Map<String, Object>> submit(@RequestBody ComplaintCreateDto dto) {
        long id = postgresService.insertComplaint(dto);
        processingService.process(id, dto.getTitle(), dto.getContent()); // 비동기 처리
        return ResponseEntity.ok(Map.of(
                "id", id,
                "status", "pending",
                "message", "민원이 접수되었습니다. AI 처리 중..."
        ));
    }

    // 민원 상세 조회
    @GetMapping("/{id}")
    public ResponseEntity<ComplaintResponseDto> getById(@PathVariable long id) {
        ComplaintResponseDto dto = postgresService.getById(id);
        if (dto == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(dto);
    }

    // 처리 상태 폴링 (프론트엔드용)
    @GetMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> getStatus(@PathVariable long id) {
        Map<String, Object> status = postgresService.getStatusById(id);
        if (status == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(status);
    }
}
