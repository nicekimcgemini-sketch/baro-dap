package com.barodap;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class BaroDapApplication {
    public static void main(String[] args) {
        SpringApplication.run(BaroDapApplication.class, args);
    }
}
