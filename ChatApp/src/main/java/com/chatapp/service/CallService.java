package com.chatapp.service;

import com.chatapp.entity.CallHistory;
import com.chatapp.entity.Message;
import com.chatapp.repository.CallHistoryRepository;
import com.chatapp.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CallService {

    private final CallHistoryRepository callHistoryRepository;
    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public void handleSignal(Map<String, Object> payload) {
        String signalType = asString(payload.get("type"));
        if (signalType == null) return;

        if ("offer".equals(signalType)) {
            createCall(payload);
        } else if ("answer".equals(signalType)) {
            markAnswered(payload);
        } else if ("reject".equals(signalType)) {
            finishCall(payload, "REJECTED");
        } else if ("end".equals(signalType)) {
            finishCall(payload, null);
        }
    }

    public List<CallHistory> getHistory(String roomId) {
        return callHistoryRepository.findByRoomIdOrderByStartedAtDesc(roomId);
    }

    private void createCall(Map<String, Object> payload) {
        String callId = asString(payload.get("callId"));
        if (callId == null || callHistoryRepository.existsById(callId)) return;

        callHistoryRepository.save(CallHistory.builder()
                .id(callId)
                .callerId(asLong(payload.get("fromUserId")))
                .receiverId(asLong(payload.get("toUserId")))
                .roomId(asString(payload.get("roomId")))
                .type(normalizeType(asString(payload.get("mode"))))
                .status("RINGING")
                .duration(0L)
                .startedAt(LocalDateTime.now())
                .build());
    }

    private void markAnswered(Map<String, Object> payload) {
        String callId = asString(payload.get("callId"));
        if (callId == null) return;

        callHistoryRepository.findById(callId).ifPresent(call -> {
            if (call.getAnsweredAt() == null) {
                call.setAnsweredAt(LocalDateTime.now());
            }
            call.setStatus("ANSWERED");
            callHistoryRepository.save(call);
        });
    }

    private void finishCall(Map<String, Object> payload, String explicitStatus) {
        String callId = asString(payload.get("callId"));
        if (callId == null) return;

        callHistoryRepository.findById(callId).ifPresent(call -> {
            LocalDateTime endedAt = LocalDateTime.now();
            String status = explicitStatus;

            if (status == null) {
                status = call.getAnsweredAt() == null ? "MISSED" : "COMPLETED";
            }

            long duration = 0;
            if ("COMPLETED".equals(status) && call.getAnsweredAt() != null) {
                duration = Math.max(0, Duration.between(call.getAnsweredAt(), endedAt).getSeconds());
            }

            call.setStatus(status);
            call.setDuration(duration);
            call.setEndedAt(endedAt);
            callHistoryRepository.save(call);

            publishCallMessage(call);
        });
    }

    private void publishCallMessage(CallHistory call) {
        if (call.getRoomId() == null || call.getRoomId().isBlank()) return;

        String content = buildSystemText(call);
        Message systemMessage = Message.builder()
                .senderId(0L)
                .receiverId(call.getReceiverId())
                .roomId(call.getRoomId())
                .content(content)
                .type("SYSTEM")
                .createdAt(LocalDateTime.now())
                .build();

        Message saved = messageRepository.save(systemMessage);
        messagingTemplate.convertAndSend("/topic/chat/" + call.getRoomId(), saved);
    }

    private String buildSystemText(CallHistory call) {
        String kind = "VIDEO".equals(call.getType()) ? "video" : "thoại";
        if ("COMPLETED".equals(call.getStatus())) {
            return "Cuộc gọi " + kind + " đã kết thúc - " + formatDuration(call.getDuration());
        }
        if ("REJECTED".equals(call.getStatus())) {
            return "Cuộc gọi " + kind + " đã bị từ chối";
        }
        return "Cuộc gọi " + kind + " bị nhỡ";
    }

    private String formatDuration(Long seconds) {
        long value = seconds == null ? 0 : Math.max(0, seconds);
        return String.format("%02d:%02d", value / 60, value % 60);
    }

    private String normalizeType(String mode) {
        return "video".equalsIgnoreCase(mode) ? "VIDEO" : "AUDIO";
    }

    private String asString(Object value) {
        if (value == null) return null;
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }

    private Long asLong(Object value) {
        if (value == null) return null;
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
