package com.barodap.service;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class ComplaintProcessingService {

    private final PostgresService postgresService;
    private final ClaudeService claudeService;
    private final GitHubService gitHubService;

    public ComplaintProcessingService(PostgresService postgresService,
                                      ClaudeService claudeService,
                                      GitHubService gitHubService) {
        this.postgresService = postgresService;
        this.claudeService = claudeService;
        this.gitHubService = gitHubService;
    }

    @Async("taskExecutor")
    public void process(long id, String title, String content) {
        try {
            ClaudeService.ClaudeResult result = claudeService.processComplaint(title, content);
            postgresService.updateWithClaudeResult(id, result);

            if (result.riskScore() >= 60) {
                gitHubService.createIssueForHighRisk(
                        id, title, result.summary(), result.urgencyScore(), result.riskScore()
                );
            }
        } catch (Exception e) {
            postgresService.logAction(id, "process_failed", e.getMessage(), "system");
        }
    }
}
