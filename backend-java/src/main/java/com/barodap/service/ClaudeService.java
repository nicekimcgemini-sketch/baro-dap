package com.barodap.service;

import com.barodap.config.AppProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ClaudeService {

    private final AppProperties props;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    private static final String SYSTEM_PROMPT = """
            당신은 금융기관 민원 분석 전문 AI입니다. 민원을 접수받아 자동으로 분류하고,
            처리 우선순위를 결정하며, 담당 부서를 배정하고, 1분 요약과 자동 답변을 생성합니다.

            ## 분류 카테고리
            - 예금/적금: 예금, 적금, 이자, 금리, 만기 관련
            - 대출/금리: 대출, 금리, 한도, 상환 관련
            - 카드결제: 신용카드, 체크카드, 결제, 할부 관련
            - 인터넷뱅킹: 앱, 인터넷뱅킹, 로그인, 비밀번호 관련
            - 계좌이체: 이체, 송금, 계좌 관련
            - 수수료: 각종 수수료, 요금 관련
            - 개인정보: 개인정보 유출, 보호 관련
            - 법적분쟁: 소송, 금감원, 법적 문제 관련
            - 기타: 위 카테고리에 해당하지 않는 민원

            ## 담당 부서
            - 금융상품팀: 예금, 적금, 대출 관련
            - 카드서비스팀: 카드 관련
            - 디지털뱅킹팀: 인터넷뱅킹, 앱 관련
            - 고객서비스팀: 계좌, 이체, 수수료 관련
            - 컴플라이언스팀: 법적분쟁, 개인정보 관련

            ## 긴급도/위험도 기준
            - urgency_score (0-100): 처리 긴급도
            - risk_score (0-100): 금감원 에스컬레이션 또는 법적 위험도

            ## 응답 형식 (반드시 JSON만 출력)
            {
                "category": "카테고리명",
                "department": "담당부서명",
                "assigned_to": "담당자명(예: 김상담, 이처리 등)",
                "urgency_score": 0~100,
                "risk_score": 0~100,
                "summary": "민원 핵심 요약 (2-3문장)",
                "facts": "사실관계 추출 (객관적 사실만)",
                "emotions": "고객 감정 상태 분석",
                "auto_response": "자동 생성 답변 (300-500자, 존댓말, 구체적 조치 포함)",
                "references": "관련 법령/약관/FAQ 인용"
            }
            """;

    public ClaudeService(AppProperties props, ObjectMapper objectMapper) {
        this.props = props;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder()
                .baseUrl("https://api.anthropic.com")
                .defaultHeader("x-api-key", props.getAnthropicApiKey())
                .defaultHeader("anthropic-version", "2023-06-01")
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    public record ClaudeResult(
            String category,
            String department,
            String assignedTo,
            int urgencyScore,
            int riskScore,
            String priority,
            String summary,
            String facts,
            String emotions,
            String autoResponse,
            String references
    ) {}

    public ClaudeResult processComplaint(String title, String content) {
        String prompt = "다음 민원을 분석하고 JSON 형식으로 응답해주세요.\n\n제목: " + title + "\n\n내용: " + content;

        Map<String, Object> requestBody = Map.of(
                "model", "claude-sonnet-4-6",
                "max_tokens", 2048,
                "system", SYSTEM_PROMPT,
                "messages", List.of(Map.of("role", "user", "content", prompt))
        );

        try {
            String responseBody = restClient.post()
                    .uri("/v1/messages")
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseBody);
            String text = root.path("content").get(0).path("text").asText();
            String json = extractJson(text);
            JsonNode result = objectMapper.readTree(json);

            int urgencyScore = result.path("urgency_score").asInt(0);
            int riskScore = result.path("risk_score").asInt(0);

            return new ClaudeResult(
                    result.path("category").asText("기타"),
                    result.path("department").asText("고객서비스팀"),
                    result.path("assigned_to").asText("미배정"),
                    urgencyScore,
                    riskScore,
                    determinePriority(urgencyScore, riskScore),
                    result.path("summary").asText(""),
                    result.path("facts").asText(""),
                    result.path("emotions").asText(""),
                    result.path("auto_response").asText(""),
                    result.path("references").asText("")
            );
        } catch (Exception e) {
            return defaultResult();
        }
    }

    public String regenerateResponse(String title, String content, String instruction) {
        String prompt = "다음 민원에 대한 답변을 재생성해주세요.\n\n제목: " + title + "\n내용: " + content;
        if (instruction != null && !instruction.isBlank()) {
            prompt += "\n\n추가 지침: " + instruction;
        }
        prompt += "\n\n300-500자의 전문적이고 정중한 답변을 작성해주세요.";

        Map<String, Object> requestBody = Map.of(
                "model", "claude-sonnet-4-6",
                "max_tokens", 1024,
                "messages", List.of(Map.of("role", "user", "content", prompt))
        );

        try {
            String responseBody = restClient.post()
                    .uri("/v1/messages")
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseBody);
            return root.path("content").get(0).path("text").asText();
        } catch (Exception e) {
            return "답변 재생성에 실패했습니다.";
        }
    }

    private String extractJson(String text) {
        // 마크다운 코드블록 안의 JSON 추출 시도
        Pattern codeBlock = Pattern.compile("```(?:json)?\\s*([\\s\\S]*?)```");
        Matcher matcher = codeBlock.matcher(text);
        if (matcher.find()) return matcher.group(1).trim();

        // 중괄호로 감싸인 JSON 추출 시도
        Pattern rawJson = Pattern.compile("\\{[\\s\\S]*\\}");
        matcher = rawJson.matcher(text);
        if (matcher.find()) return matcher.group();

        return text;
    }

    private String determinePriority(int urgencyScore, int riskScore) {
        if (riskScore >= 80 || urgencyScore >= 90) return "critical";
        if (riskScore >= 60 || urgencyScore >= 70) return "high";
        return "normal";
    }

    private ClaudeResult defaultResult() {
        return new ClaudeResult(
                "기타", "고객서비스팀", "미배정",
                0, 0, "normal",
                "AI 처리 실패", "처리 중 오류 발생", "알 수 없음",
                "담당자가 확인 후 답변 드리겠습니다.", ""
        );
    }
}
