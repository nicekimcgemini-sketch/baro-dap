package com.barodap.controller;

import com.barodap.dto.ComplaintListItemDto;
import com.barodap.dto.ComplaintStatusUpdateDto;
import com.barodap.service.ClaudeService;
import com.barodap.service.PostgresService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final PostgresService postgresService;
    private final ClaudeService claudeService;

    public AdminController(PostgresService postgresService, ClaudeService claudeService) {
        this.postgresService = postgresService;
        this.claudeService = claudeService;
    }

    // 민원 목록
    @GetMapping("/complaints")
    public ResponseEntity<List<ComplaintListItemDto>> list(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(postgresService.getComplaints(status, limit));
    }

    // 상태/담당자/최종답변 업데이트
    @PatchMapping("/complaints/{id}")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable long id,
            @RequestBody ComplaintStatusUpdateDto dto) {
        postgresService.updateStatus(id, dto);
        return ResponseEntity.ok(Map.of("message", "업데이트 완료"));
    }

    // 답변 재생성
    @PostMapping("/complaints/{id}/regenerate")
    public ResponseEntity<Map<String, Object>> regenerate(
            @PathVariable long id,
            @RequestBody(required = false) Map<String, String> body) {
        var complaint = postgresService.getById(id);
        if (complaint == null) return ResponseEntity.notFound().build();

        String instruction = body != null ? body.get("instruction") : null;
        String newResponse = claudeService.regenerateResponse(
                complaint.getTitle(), complaint.getContent(), instruction);
        postgresService.updateAutoResponse(id, newResponse);

        return ResponseEntity.ok(Map.of(
                "auto_response", newResponse,
                "message", "답변이 재생성되었습니다."
        ));
    }

    // 대시보드 통계
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> stats() {
        return ResponseEntity.ok(postgresService.getStats());
    }

    // 처리 로그
    @GetMapping("/complaints/{id}/logs")
    public ResponseEntity<List<Map<String, Object>>> logs(@PathVariable long id) {
        return ResponseEntity.ok(postgresService.getLogs(id));
    }
}
