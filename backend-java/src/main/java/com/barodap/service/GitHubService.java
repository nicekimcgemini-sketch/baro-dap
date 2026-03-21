package com.barodap.service;

import com.barodap.config.AppProperties;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class GitHubService {

    private final AppProperties props;

    public GitHubService(AppProperties props) {
        this.props = props;
    }

    public void createIssueForHighRisk(long complaintId, String title, String summary,
                                       int urgencyScore, int riskScore) {
        String token = props.getGithubToken();
        String repo = props.getGithubRepo();

        if (token == null || token.isBlank() || repo == null || repo.isBlank()) {
            return; // GitHub 연동 미설정 시 스킵
        }

        String label = riskScore >= 80 ? "critical" : "high-risk";

        String body = """
                ## 고위험 민원 자동 등록

                **민원 ID:** %d
                **긴급도:** %d
                **위험도:** %d

                ## 요약
                %s

                ---
                *이 이슈는 Baro-Dap 시스템에 의해 자동 생성되었습니다.*
                """.formatted(complaintId, urgencyScore, riskScore, summary);

        Map<String, Object> requestBody = Map.of(
                "title", "[고위험 민원] " + title,
                "body", body,
                "labels", List.of(label, "민원", "auto-generated")
        );

        try {
            RestClient.builder()
                    .baseUrl("https://api.github.com")
                    .defaultHeader("Authorization", "Bearer " + token)
                    .defaultHeader("Accept", "application/vnd.github+json")
                    .defaultHeader("Content-Type", "application/json")
                    .build()
                    .post()
                    .uri("/repos/" + repo + "/issues")
                    .body(requestBody)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            // GitHub 이슈 생성 실패해도 민원 처리는 계속
        }
    }
}
