package com.barodap.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ComplaintStatusUpdateDto {

    private String status;

    @JsonProperty("final_response")
    private String finalResponse;

    @JsonProperty("assigned_to")
    private String assignedTo;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getFinalResponse() { return finalResponse; }
    public void setFinalResponse(String finalResponse) { this.finalResponse = finalResponse; }

    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }
}
