package com.chatapp.service;

import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
public class ToxicModerationService {

    private static final List<String> TOXIC_WORDS = List.of(
            "dm", "dmm", "đm", "đmm",
            "dit", "địt", "du", "đụ",
            "cac", "cặc", "lon", "lồn", "buoi", "buồi",
            "oc cho", "óc chó",
            "cho de", "chó đẻ",
            "cho chet", "chó chết",
            "do cho", "đồ chó",
            "ngu", "đần", "dan",
            "deo", "đéo",
            "cc", "cl", "vcl", "vl", "cmm", "cmn",
            "fuck", "shit", "bitch", "asshole",
            "stupid", "idiot", "moron", "dumb"
    );

    public boolean isToxic(String content) {
        if (content == null || content.isBlank()) {
            return false;
        }

        String normalizedContent = normalize(content);

        return TOXIC_WORDS.stream()
                .map(this::normalize)
                .anyMatch(normalizedContent::contains);
    }

    public String getViolationMessage() {
        return "Tin nhắn của bạn bị vi phạm tiêu chuẩn cộng đồng.";
    }

    private String normalize(String value) {
        String lower = value.toLowerCase(Locale.ROOT)
                .replace('đ', 'd')
                .replace('Đ', 'd');

        String noAccent = Normalizer.normalize(lower, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");

        return noAccent
                .replaceAll("[^a-z0-9]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
