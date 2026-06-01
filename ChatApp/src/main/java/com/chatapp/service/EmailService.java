package com.chatapp.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final String mailUsername;
    private final String mailFrom;
    private final String brevoApiKey;
    private final HttpClient httpClient;

    public EmailService(JavaMailSender mailSender,
                        @Value("${spring.mail.username:}") String mailUsername,
                        @Value("${mail.from:}") String mailFrom,
                        @Value("${brevo.api.key:}") String brevoApiKey) {
        this.mailSender = mailSender;
        this.mailUsername = mailUsername;
        this.mailFrom = mailFrom;
        this.brevoApiKey = brevoApiKey;
        this.httpClient = HttpClient.newHttpClient();
    }

    public void sendOtp(String email, String otp) {
        if (brevoApiKey != null && !brevoApiKey.isBlank()) {
            sendOtpWithBrevo(email, otp);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        if (mailUsername != null && !mailUsername.isBlank()) {
            message.setFrom(mailUsername);
        }
        message.setTo(email);
        message.setSubject("Ma OTP xac thuc KindChat");
        message.setText("Ma OTP cua ban la: " + otp + ". Ma co hieu luc trong 5 phut.");

        mailSender.send(message);
    }

    private void sendOtpWithBrevo(String email, String otp) {
        String senderEmail = firstNonBlank(mailFrom, mailUsername);
        if (senderEmail == null) {
            throw new RuntimeException("MAIL_FROM hoac MAIL_USERNAME chua duoc cau hinh");
        }

        String body = """
                {
                  "sender": {"name": "KindChat", "email": "%s"},
                  "to": [{"email": "%s"}],
                  "subject": "Ma OTP xac thuc KindChat",
                  "textContent": "Ma OTP cua ban la: %s. Ma co hieu luc trong 5 phut."
                }
                """.formatted(jsonEscape(senderEmail), jsonEscape(email), jsonEscape(otp));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.brevo.com/v3/smtp/email"))
                .header("Accept", "application/json")
                .header("Content-Type", "application/json")
                .header("api-key", brevoApiKey)
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new RuntimeException("Brevo send mail failed: " + response.statusCode() + " - " + response.body());
            }
        } catch (IOException e) {
            throw new RuntimeException("Brevo send mail failed: " + e.getMessage(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Brevo send mail interrupted", e);
        }
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        if (second != null && !second.isBlank()) {
            return second;
        }
        return null;
    }

    private String jsonEscape(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
