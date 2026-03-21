package com.barodap.service;

import com.barodap.dto.ComplaintCreateDto;
import com.barodap.dto.ComplaintListItemDto;
import com.barodap.dto.ComplaintResponseDto;
import com.barodap.dto.ComplaintStatusUpdateDto;
import com.barodap.service.ClaudeService.ClaudeResult;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class PostgresService {

    private final JdbcTemplate jdbc;

    public PostgresService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // ── 민원 접수 ──────────────────────────────────────────────
    public long insertComplaint(ComplaintCreateDto dto) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbc.update(conn -> {
            PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO complaints (complainant_name, contact, title, content, status) VALUES (?, ?, ?, ?, 'pending')",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setString(1, dto.getComplainantName());
            ps.setString(2, dto.getContact());
            ps.setString(3, dto.getTitle());
            ps.setString(4, dto.getContent());
            return ps;
        }, keyHolder);
        return keyHolder.getKey().longValue();
    }

    // ── AI 처리 결과 저장 ────────────────────────────────────────
    public void updateWithClaudeResult(long id, ClaudeResult result) {
        jdbc.update("""
                UPDATE complaints SET
                    category=?, department=?, assigned_to=?,
                    urgency_score=?, risk_score=?, priority=?,
                    summary=?, facts=?, emotions=?,
                    auto_response=?, "references"=?,
                    status='responded', processed_at=CURRENT_TIMESTAMP
                WHERE id=?
                """,
                result.category(), result.department(), result.assignedTo(),
                result.urgencyScore(), result.riskScore(), result.priority(),
                result.summary(), result.facts(), result.emotions(),
                result.autoResponse(), result.references(),
                id
        );
        logAction(id, "ai_processed", "AI 자동 분류/분석 완료", "system");
    }

    // ── 상태 업데이트 (관리자) ────────────────────────────────────
    public void updateStatus(long id, ComplaintStatusUpdateDto dto) {
        StringBuilder sql = new StringBuilder("UPDATE complaints SET updated_at=CURRENT_TIMESTAMP");
        List<Object> params = new ArrayList<>();

        if (dto.getStatus() != null) {
            sql.append(", status=?");
            params.add(dto.getStatus());
        }
        if (dto.getFinalResponse() != null) {
            sql.append(", final_response=?");
            params.add(dto.getFinalResponse());
        }
        if (dto.getAssignedTo() != null) {
            sql.append(", assigned_to=?");
            params.add(dto.getAssignedTo());
        }
        sql.append(" WHERE id=?");
        params.add(id);

        jdbc.update(sql.toString(), params.toArray());
        logAction(id, "status_updated", "상태 업데이트: " + dto.getStatus(), "admin");
    }

    // ── 답변 재생성 저장 ─────────────────────────────────────────
    public void updateAutoResponse(long id, String autoResponse) {
        jdbc.update(
                "UPDATE complaints SET auto_response=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
                autoResponse, id
        );
        logAction(id, "response_regenerated", "답변 재생성", "admin");
    }

    // ── 조회 ─────────────────────────────────────────────────────
    public ComplaintResponseDto getById(long id) {
        List<ComplaintResponseDto> list = jdbc.query(
                "SELECT * FROM complaints WHERE id=?", complaintResponseMapper, id
        );
        return list.isEmpty() ? null : list.get(0);
    }

    public Map<String, Object> getStatusById(long id) {
        List<Map<String, Object>> list = jdbc.queryForList(
                "SELECT id, status, priority, auto_response, summary FROM complaints WHERE id=?", id
        );
        return list.isEmpty() ? null : list.get(0);
    }

    public List<ComplaintListItemDto> getComplaints(String status, int limit) {
        String sql = "SELECT id, uuid, title, category, department, priority, urgency_score, risk_score, status, assigned_to, created_at FROM complaints";
        if (status != null && !status.isBlank()) {
            return jdbc.query(sql + " WHERE status=? ORDER BY priority DESC, created_at DESC LIMIT ?",
                    complaintListItemMapper, status, limit);
        }
        return jdbc.query(sql + " ORDER BY priority DESC, created_at DESC LIMIT ?",
                complaintListItemMapper, limit);
    }

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new java.util.LinkedHashMap<>();
        stats.put("total", jdbc.queryForObject("SELECT COUNT(*) FROM complaints", Long.class));
        stats.put("by_status", jdbc.queryForList("SELECT status, COUNT(*) as count FROM complaints GROUP BY status"));
        stats.put("by_priority", jdbc.queryForList("SELECT priority, COUNT(*) as count FROM complaints GROUP BY priority"));
        stats.put("avg_scores", jdbc.queryForMap(
                "SELECT ROUND(AVG(urgency_score)) as avg_urgency, ROUND(AVG(risk_score)) as avg_risk FROM complaints"));
        return stats;
    }

    public List<Map<String, Object>> getLogs(long complaintId) {
        return jdbc.queryForList(
                "SELECT * FROM complaint_logs WHERE complaint_id=? ORDER BY created_at DESC", complaintId
        );
    }

    // ── 로그 기록 ─────────────────────────────────────────────────
    public void logAction(long complaintId, String action, String description, String actor) {
        jdbc.update(
                "INSERT INTO complaint_logs (complaint_id, action, description, actor) VALUES (?, ?, ?, ?)",
                complaintId, action, description, actor
        );
    }

    // ── RowMapper ─────────────────────────────────────────────────
    private final RowMapper<ComplaintResponseDto> complaintResponseMapper = (rs, rowNum) -> {
        ComplaintResponseDto dto = new ComplaintResponseDto();
        dto.setId(rs.getLong("id"));
        dto.setUuid(rs.getString("uuid"));
        dto.setComplainantName(rs.getString("complainant_name"));
        dto.setContact(rs.getString("contact"));
        dto.setTitle(rs.getString("title"));
        dto.setContent(rs.getString("content"));
        dto.setCategory(rs.getString("category"));
        dto.setDepartment(rs.getString("department"));
        dto.setAssignedTo(rs.getString("assigned_to"));
        dto.setUrgencyScore(rs.getInt("urgency_score"));
        dto.setRiskScore(rs.getInt("risk_score"));
        dto.setPriority(rs.getString("priority"));
        dto.setSummary(rs.getString("summary"));
        dto.setFacts(rs.getString("facts"));
        dto.setEmotions(rs.getString("emotions"));
        dto.setAutoResponse(rs.getString("auto_response"));
        dto.setReferences(rs.getString("references"));
        dto.setStatus(rs.getString("status"));
        dto.setFinalResponse(rs.getString("final_response"));
        var createdAt = rs.getTimestamp("created_at");
        if (createdAt != null) dto.setCreatedAt(createdAt.toLocalDateTime());
        var updatedAt = rs.getTimestamp("updated_at");
        if (updatedAt != null) dto.setUpdatedAt(updatedAt.toLocalDateTime());
        return dto;
    };

    private final RowMapper<ComplaintListItemDto> complaintListItemMapper = (rs, rowNum) -> {
        ComplaintListItemDto dto = new ComplaintListItemDto();
        dto.setId(rs.getLong("id"));
        dto.setUuid(rs.getString("uuid"));
        dto.setTitle(rs.getString("title"));
        dto.setCategory(rs.getString("category"));
        dto.setDepartment(rs.getString("department"));
        dto.setPriority(rs.getString("priority"));
        dto.setUrgencyScore(rs.getInt("urgency_score"));
        dto.setRiskScore(rs.getInt("risk_score"));
        dto.setStatus(rs.getString("status"));
        dto.setAssignedTo(rs.getString("assigned_to"));
        var createdAt = rs.getTimestamp("created_at");
        if (createdAt != null) dto.setCreatedAt(createdAt.toLocalDateTime());
        return dto;
    };
}
