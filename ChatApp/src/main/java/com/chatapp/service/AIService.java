package com.chatapp.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
public class AIService {

    @Value("${gemini.api.key}")
    private String API_KEY;

    private final ObjectMapper mapper = new ObjectMapper();

    public String askAI(String message) {
        try {
            return generateText(message);
        } catch (Exception e) {
            e.printStackTrace();
            return "AI lỗi rồi.";
        }
    }

    public List<String> rewriteSuggestions(String text) {
        String cleanText = text == null ? "" : text.trim();

        if (cleanText.isBlank()) {
            return List.of();
        }

        String prompt = """
                You are a Vietnamese chat message writing assistant.
                Rewrite the user's draft into 4 natural Vietnamese message options.
                Requirements:
                - Keep the same intent and meaning.
                - If the draft is a question, keep it as a question.
                - If the draft is a statement, keep it as a statement or light conversational remark.
                - Make every option clearly different in wording and tone.
                - Use casual Vietnamese suitable for chat.
                - Do not answer the message.
                - Do not add facts that the draft does not contain.
                - Keep each option under 25 Vietnamese words.
                Return raw JSON only. The first character must be {.
                JSON shape: {"suggestions":["...","...","...","..."]}

                Draft: %s
                """.formatted(cleanText);

        try {
            return normalizeSuggestions(generateText(prompt), cleanText);
        } catch (Exception e) {
            e.printStackTrace();
            return fallbackSuggestions(cleanText);
        }
    }

    private String generateText(String prompt) throws IOException {
        URL url = new URL(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY
        );

        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        conn.setDoOutput(true);

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", prompt)))
                ),
                "generationConfig", Map.of(
                        "temperature", 0.9,
                        "topP", 0.95,
                        "maxOutputTokens", 1200,
                        "responseMimeType", "application/json",
                        "thinkingConfig", Map.of("thinkingBudget", 0)
                )
        );

        try (OutputStream outputStream = conn.getOutputStream()) {
            outputStream.write(mapper.writeValueAsBytes(body));
        }

        int status = conn.getResponseCode();
        InputStream stream = status >= 200 && status < 300
                ? conn.getInputStream()
                : conn.getErrorStream();

        String json = readAll(stream);
        System.out.println("Gemini response: " + json);

        JsonNode root = mapper.readTree(json);

        if (root.has("error")) {
            throw new IOException(root.path("error").path("message").asText("Gemini error"));
        }

        JsonNode candidates = root.path("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            throw new IOException("Gemini khong co phan hoi");
        }

        JsonNode textNode = candidates
                .get(0)
                .path("content")
                .path("parts")
                .get(0)
                .path("text");

        String text = textNode.asText();
        if (text == null || text.isBlank()) {
            throw new IOException("Gemini tra ve rong");
        }

        return text;
    }

    private String readAll(InputStream stream) throws IOException {
        if (stream == null) {
            return "";
        }

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            StringBuilder response = new StringBuilder();
            String line;

            while ((line = reader.readLine()) != null) {
                response.append(line);
            }

            return response.toString();
        }
    }

    private List<String> normalizeSuggestions(String rawText, String originalText) {
        String cleaned = rawText
                .replace("```json", "")
                .replace("```", "")
                .trim();

        List<String> suggestions = new ArrayList<>();

        try {
            JsonNode root = mapper.readTree(cleaned);
            JsonNode arrayNode = root.isArray() ? root : root.path("suggestions");

            if (arrayNode.isArray()) {
                for (JsonNode item : arrayNode) {
                    addSuggestion(suggestions, item.asText());
                }
            }
        } catch (Exception ignored) {
            for (String line : cleaned.split("\\R")) {
                addSuggestion(suggestions, line);
            }
        }

        if (suggestions.isEmpty()) {
            suggestions.addAll(fallbackSuggestions(originalText));
        }

        return suggestions.stream().limit(4).toList();
    }

    private void addSuggestion(List<String> suggestions, String value) {
        String suggestion = value == null ? "" : value.trim()
                .replaceFirst("^[\\d\\-•.)\\s]+", "")
                .replaceAll("^\"|\"$", "")
                .trim();

        if (!suggestion.isBlank() && !suggestions.contains(suggestion)) {
            suggestions.add(suggestion);
        }
    }

    private List<String> fallbackSuggestions(String text) {
        String lower = text.toLowerCase();
        boolean isQuestion = text.endsWith("?")
                || lower.contains(" thế nào")
                || lower.contains(" sao")
                || lower.contains(" không")
                || lower.contains(" chưa")
                || lower.contains(" hả")
                || lower.contains(" à");

        if (containsAny(lower, "thời tiết", "trời", "nắng", "mưa", "đẹp trời")) {
            if (isQuestion) {
                return List.of(
                        "Hôm nay thời tiết bên bạn thế nào?",
                        "Ngoài đó hôm nay trời ổn không?",
                        "Hôm nay trời có dễ chịu không vậy?",
                        "Bên bạn hôm nay nắng mưa ra sao?"
                );
            }

            return List.of(
                    "Trời hôm nay đẹp ghê, nhìn là muốn ra ngoài.",
                    "Hôm nay thời tiết dễ chịu thật.",
                    "Trời đẹp vậy mà ở nhà thì hơi phí nhỉ?",
                    "Hôm nay trời sáng sủa, cảm giác cũng vui hơn hẳn."
            );
        }

        if (isQuestion) {
            return List.of(
                    text,
                    "Bạn thấy " + lowerFirst(text),
                    "Cho mình hỏi chút, " + lowerFirst(text),
                    "Không biết " + lowerFirst(text)
            );
        }

        return List.of(
                text,
                makeConversational(text),
                "Nghe cũng hay đó: " + lowerFirst(text),
                "Mình thấy " + lowerFirst(text)
        );
    }

    private boolean containsAny(String text, String... keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }

        return false;
    }

    private String makeConversational(String text) {
        String trimmed = Pattern.compile("[.!?]+$").matcher(text.trim()).replaceAll("");
        return trimmed + " ghê.";
    }

    private String lowerFirst(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }

        return text.substring(0, 1).toLowerCase() + text.substring(1);
    }
}
