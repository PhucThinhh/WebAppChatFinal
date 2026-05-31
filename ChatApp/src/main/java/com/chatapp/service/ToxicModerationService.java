package com.chatapp.service;

import com.chatapp.entity.ModerationLog;
import com.chatapp.repository.ModerationLogRepository;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ToxicModerationService {

    private static final int SHORT_MUTE_THRESHOLD = 3;
    private static final int LONG_MUTE_THRESHOLD = 6;
    private static final Duration VIOLATION_WINDOW = Duration.ofMinutes(30);
    private static final Duration SHORT_MUTE = Duration.ofMinutes(5);
    private static final Duration LONG_MUTE = Duration.ofMinutes(30);

    private static final List<String> TOXIC_TERMS = List.of(
            "dm", "dmm", "dit", "du", "cac", "lon", "buoi",
            "oc cho", "cho de", "cho chet", "do cho",
            "ngu", "dan", "deo",
            "cc", "cl", "vcl", "vl", "cmm", "cmn",
            "fuck", "shit", "bitch", "asshole",
            "stupid", "idiot", "moron", "dumb"
    );

    private final ModerationLogRepository moderationLogRepository;

    public boolean isToxic(String content) {
        return !findMatchedWords(content).isEmpty();
    }

    public String getViolationMessage() {
        return "Tin nhắn của bạn bị vi phạm tiêu chuẩn cộng đồng.";
    }

    public ModerationResult moderate(Long userId, String roomId, String content) {
        LocalDateTime now = LocalDateTime.now();
        ModerationLog activeMute = moderationLogRepository
                .findTopByUserIdAndActionAndMutedUntilAfterOrderByMutedUntilDesc(userId, "MUTE", now)
                .orElse(null);

        if (activeMute != null) {
            return ModerationResult.muted(activeMute.getMutedUntil());
        }

        List<String> matchedWords = findMatchedWords(content);
        if (matchedWords.isEmpty()) {
            return ModerationResult.allowed();
        }

        int violationCount = (int) moderationLogRepository
                .countByUserIdAndCreatedAtAfter(userId, now.minus(VIOLATION_WINDOW)) + 1;

        String action = "BLOCK_MESSAGE";
        LocalDateTime mutedUntil = null;

        if (violationCount >= LONG_MUTE_THRESHOLD) {
            action = "MUTE";
            mutedUntil = now.plus(LONG_MUTE);
        } else if (violationCount >= SHORT_MUTE_THRESHOLD) {
            action = "MUTE";
            mutedUntil = now.plus(SHORT_MUTE);
        }

        moderationLogRepository.save(ModerationLog.builder()
                .userId(userId)
                .roomId(roomId)
                .originalContent(content)
                .matchedWords(matchedWords)
                .action(action)
                .violationCount(violationCount)
                .mutedUntil(mutedUntil)
                .createdAt(now)
                .build());

        if ("MUTE".equals(action)) {
            return ModerationResult.blocked(
                    action,
                    matchedWords,
                    mutedUntil,
                    "Bạn vi phạm nhiều lần nên bị tạm mute đến " + mutedUntil.toLocalTime().withNano(0) + "."
            );
        }

        return ModerationResult.blocked(action, matchedWords, null, getViolationMessage());
    }

    public List<String> findMatchedWords(String content) {
        if (content == null || content.isBlank()) {
            return List.of();
        }

        String normalizedContent = normalize(content);
        String compactContent = compact(normalizedContent);
        Set<String> matches = new LinkedHashSet<>();

        for (String term : TOXIC_TERMS) {
            String normalizedTerm = normalize(term);
            if (normalizedContent.contains(normalizedTerm)
                    || compactContent.contains(compact(normalizedTerm))) {
                matches.add(term);
            }
        }

        return new ArrayList<>(matches);
    }

    private String normalize(String value) {
        String lower = value.toLowerCase(Locale.ROOT)
                .replace('đ', 'd')
                .replace('Đ', 'd')
                .replace('0', 'o')
                .replace('1', 'i')
                .replace('!', 'i')
                .replace('|', 'i')
                .replace('3', 'e')
                .replace('4', 'a')
                .replace('@', 'a')
                .replace('5', 's')
                .replace('$', 's')
                .replace('7', 't');

        String noAccent = Normalizer.normalize(lower, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");

        return noAccent
                .replaceAll("[^a-z0-9]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String compact(String value) {
        return value.replace(" ", "");
    }

    @Getter
    @AllArgsConstructor
    public static class ModerationResult {
        private boolean blocked;
        private String action;
        private List<String> matchedWords;
        private LocalDateTime mutedUntil;
        private String message;

        public static ModerationResult allowed() {
            return new ModerationResult(false, null, List.of(), null, null);
        }

        public static ModerationResult muted(LocalDateTime mutedUntil) {
            return new ModerationResult(
                    true,
                    "MUTE",
                    List.of(),
                    mutedUntil,
                    "Bạn đang bị tạm mute đến " + mutedUntil.toLocalTime().withNano(0) + "."
            );
        }

        public static ModerationResult blocked(
                String action,
                List<String> matchedWords,
                LocalDateTime mutedUntil,
                String message
        ) {
            return new ModerationResult(true, action, matchedWords, mutedUntil, message);
        }
    }
}
