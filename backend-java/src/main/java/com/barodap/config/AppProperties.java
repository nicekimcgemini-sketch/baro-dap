package com.barodap.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AppProperties {

    @Value("${anthropic.api-key}")
    private String anthropicApiKey;

    @Value("${github.token:}")
    private String githubToken;

    @Value("${github.repo:}")
    private String githubRepo;

    public String getAnthropicApiKey() { return anthropicApiKey; }
    public String getGithubToken() { return githubToken; }
    public String getGithubRepo() { return githubRepo; }
}
