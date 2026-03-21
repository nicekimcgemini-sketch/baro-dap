package com.barodap.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ComplaintCreateDto {

    @JsonProperty("complainant_name")
    private String complainantName;

    private String contact;
    private String title;
    private String content;

    public String getComplainantName() { return complainantName; }
    public void setComplainantName(String complainantName) { this.complainantName = complainantName; }

    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
