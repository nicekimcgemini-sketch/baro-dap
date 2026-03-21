package com.barodap.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

public class ComplaintResponseDto {

    private Long id;
    private String uuid;

    @JsonProperty("complainant_name")
    private String complainantName;

    private String contact;
    private String title;
    private String content;
    private String category;
    private String department;

    @JsonProperty("assigned_to")
    private String assignedTo;

    @JsonProperty("urgency_score")
    private Integer urgencyScore;

    @JsonProperty("risk_score")
    private Integer riskScore;

    private String priority;
    private String summary;
    private String facts;
    private String emotions;

    @JsonProperty("auto_response")
    private String autoResponse;

    private String references;
    private String status;

    @JsonProperty("final_response")
    private String finalResponse;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("updated_at")
    private LocalDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUuid() { return uuid; }
    public void setUuid(String uuid) { this.uuid = uuid; }

    public String getComplainantName() { return complainantName; }
    public void setComplainantName(String v) { this.complainantName = v; }

    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }

    public Integer getUrgencyScore() { return urgencyScore; }
    public void setUrgencyScore(Integer urgencyScore) { this.urgencyScore = urgencyScore; }

    public Integer getRiskScore() { return riskScore; }
    public void setRiskScore(Integer riskScore) { this.riskScore = riskScore; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getFacts() { return facts; }
    public void setFacts(String facts) { this.facts = facts; }

    public String getEmotions() { return emotions; }
    public void setEmotions(String emotions) { this.emotions = emotions; }

    public String getAutoResponse() { return autoResponse; }
    public void setAutoResponse(String autoResponse) { this.autoResponse = autoResponse; }

    public String getReferences() { return references; }
    public void setReferences(String references) { this.references = references; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getFinalResponse() { return finalResponse; }
    public void setFinalResponse(String finalResponse) { this.finalResponse = finalResponse; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
