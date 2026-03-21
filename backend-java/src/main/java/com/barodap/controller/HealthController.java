package com.barodap.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.Map;

@Controller
public class HealthController {

    @GetMapping("/health")
    @ResponseBody
    public Map<String, Object> health() {
        return Map.of("status", "ok", "service", "baro-dap");
    }

    // 민원 접수 페이지
    @GetMapping("/")
    public String index() {
        return "forward:/index.html";
    }

    // 관리자 대시보드
    @GetMapping("/admin")
    public String admin() {
        return "forward:/admin.html";
    }
}
