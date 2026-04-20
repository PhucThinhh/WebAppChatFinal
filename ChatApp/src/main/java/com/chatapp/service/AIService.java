package com.chatapp.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

@Service
public class AIService {

    @Value("${gemini.api.key}")
    private String API_KEY;

    public String askAI(String message) {
        try {
            // 🔥 MODEL ĐÚNG
            URL url = new URL(
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY
            );

            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);

            // 🔥 BODY
            String body = """
            {
              "contents": [
                {
                  "parts": [
                    { "text": "%s" }
                  ]
                }
              ]
            }
            """.formatted(message);

            conn.getOutputStream().write(body.getBytes());

            // 🔥 FIX ERROR STREAM
            InputStream is;
            int status = conn.getResponseCode();

            if (status >= 200 && status < 300) {
                is = conn.getInputStream();
            } else {
                is = conn.getErrorStream();
            }

            BufferedReader reader = new BufferedReader(new InputStreamReader(is));

            StringBuilder response = new StringBuilder();
            String line;

            while ((line = reader.readLine()) != null) {
                response.append(line);
            }

            String json = response.toString();

            // 🔥 DEBUG
            System.out.println("Gemini response: " + json);

            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(json);

            // ❗ HANDLE ERROR
            if (root.has("error")) {
                return "AI lỗi: " + root.path("error").path("message").asText();
            }

            // ❗ CHECK NULL
            JsonNode candidates = root.path("candidates");

            if (!candidates.isArray() || candidates.size() == 0) {
                return "AI không có phản hồi";
            }

            JsonNode textNode = candidates
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text");

            return textNode.asText("AI không trả lời 😢");

        } catch (Exception e) {
            e.printStackTrace();
            return "AI lỗi rồi 😢";
        }
    }
}