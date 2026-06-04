package com.chatapp.service;

import com.chatapp.dto.AddPollOptionRequest;
import com.chatapp.dto.CreatePollRequest;
import com.chatapp.dto.PollOptionResponseDTO;
import com.chatapp.dto.PollResponseDTO;
import com.chatapp.dto.PollVoterDTO;
import com.chatapp.dto.VotePollRequest;
import com.chatapp.entity.Message;
import com.chatapp.entity.Poll;
import com.chatapp.entity.PollOption;
import com.chatapp.entity.User;
import com.chatapp.repository.GroupMemberRepository;
import com.chatapp.repository.MessageRepository;
import com.chatapp.repository.PollRepository;
import com.chatapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PollService {

    private final PollRepository pollRepository;
    private final MessageRepository messageRepository;
    private final GroupMemberRepository memberRepo;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    // =========================
    // CREATE POLL
    // =========================
    public PollResponseDTO createPoll(CreatePollRequest request, Long userId) {

        if (request.getRoomId() == null || request.getRoomId().isBlank()) {
            throw new RuntimeException("RoomId không hợp lệ");
        }

        if (request.getQuestion() == null || request.getQuestion().isBlank()) {
            throw new RuntimeException("Câu hỏi bình chọn không được để trống");
        }

        if (request.getOptions() == null || request.getOptions().size() < 2) {
            throw new RuntimeException("Bình chọn phải có ít nhất 2 lựa chọn");
        }

        validateCanUseRoom(request.getRoomId(), userId);

        List<PollOption> options = new ArrayList<>();

        for (String text : request.getOptions()) {
            if (text == null || text.isBlank()) continue;

            options.add(
                    PollOption.builder()
                            .id(UUID.randomUUID().toString())
                            .text(text.trim())
                            .createdBy(userId)
                            .createdAt(LocalDateTime.now())
                            .voters(new ArrayList<>())
                            .build()
            );
        }

        if (options.size() < 2) {
            throw new RuntimeException("Bình chọn phải có ít nhất 2 lựa chọn hợp lệ");
        }

        Poll poll = Poll.builder()
                .roomId(request.getRoomId())
                .question(request.getQuestion().trim())
                .createdBy(userId)
                .createdAt(LocalDateTime.now())
                .expiresAt(request.getExpiresAt())
                .closed(false)
                .multipleChoice(Boolean.TRUE.equals(request.getMultipleChoice()))
                .allowAddOption(Boolean.TRUE.equals(request.getAllowAddOption()))
                .anonymous(Boolean.TRUE.equals(request.getAnonymous()))
                .hideResultUntilVoted(Boolean.TRUE.equals(request.getHideResultUntilVoted()))
                .pinned(Boolean.TRUE.equals(request.getPinned()))
                .options(options)
                .build();

        Poll savedPoll = pollRepository.save(poll);

        Message pollMessage = Message.builder()
                .senderId(userId)
                .receiverId(null)
                .roomId(request.getRoomId())
                .content(savedPoll.getQuestion())
                .type("POLL")
                .pollId(savedPoll.getId())
                .isDeleted(false)
                .isRecalled(false)
                .createdAt(LocalDateTime.now())
                .pinned(Boolean.TRUE.equals(savedPoll.getPinned()))
                .pinnedBy(Boolean.TRUE.equals(savedPoll.getPinned()) ? userId : null)
                .pinnedAt(Boolean.TRUE.equals(savedPoll.getPinned()) ? LocalDateTime.now() : null)
                .build();

        Message savedMessage = messageRepository.save(pollMessage);

        messagingTemplate.convertAndSend(
                "/topic/chat/" + request.getRoomId(),
                savedMessage
        );

        if (Boolean.TRUE.equals(savedPoll.getPinned())) {
            messagingTemplate.convertAndSend(
                    "/topic/chat/" + request.getRoomId() + "/pin",
                    savedMessage
            );
        }

        PollResponseDTO response = toResponse(savedPoll, userId);

        messagingTemplate.convertAndSend(
                "/topic/chat/" + request.getRoomId() + "/poll",
                response
        );

        return response;
    }

    // =========================
    // GET POLL
    // =========================
    public PollResponseDTO getPoll(String pollId, Long userId) {

        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Bình chọn không tồn tại"
                ));

        validateCanUseRoom(poll.getRoomId(), userId);

        return toResponse(poll, userId);
    }

    // =========================
    // VOTE POLL
    // =========================
    public PollResponseDTO votePoll(String pollId, VotePollRequest request, Long userId) {

        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new RuntimeException("Bình chọn không tồn tại"));

        validateCanUseRoom(poll.getRoomId(), userId);

        if (Boolean.TRUE.equals(poll.getClosed())) {
            throw new RuntimeException("Bình chọn đã đóng");
        }

        if (poll.getExpiresAt() != null && poll.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Bình chọn đã hết hạn");
        }

        if (request.getOptionIds() == null || request.getOptionIds().isEmpty()) {
            throw new RuntimeException("Bạn chưa chọn lựa chọn nào");
        }

        List<String> selectedOptionIds = request.getOptionIds();

        if (!Boolean.TRUE.equals(poll.getMultipleChoice()) && selectedOptionIds.size() > 1) {
            throw new RuntimeException("Bình chọn này chỉ cho chọn 1 lựa chọn");
        }

        HashSet<String> selectedSet = new HashSet<>(selectedOptionIds);

        boolean hasValidOption = poll.getOptions().stream()
                .anyMatch(option -> selectedSet.contains(option.getId()));

        if (!hasValidOption) {
            throw new RuntimeException("Lựa chọn không hợp lệ");
        }

        /*
         * Với cả chọn 1 và chọn nhiều:
         * mỗi lần submit sẽ xoá lựa chọn cũ của user,
         * rồi thêm lại các option đang chọn.
         */
        for (PollOption option : poll.getOptions()) {
            if (option.getVoters() == null) {
                option.setVoters(new ArrayList<>());
            }

            option.getVoters().removeIf(voterId -> voterId.equals(userId));
        }

        for (PollOption option : poll.getOptions()) {
            if (selectedSet.contains(option.getId())) {
                if (option.getVoters() == null) {
                    option.setVoters(new ArrayList<>());
                }

                if (!option.getVoters().contains(userId)) {
                    option.getVoters().add(userId);
                }
            }
        }

        Poll saved = pollRepository.save(poll);

        PollResponseDTO response = toResponse(saved, userId);

        messagingTemplate.convertAndSend(
                "/topic/chat/" + saved.getRoomId() + "/poll",
                response
        );

        return response;
    }

    // =========================
    // ADD OPTION
    // =========================
    public PollResponseDTO addOption(String pollId, AddPollOptionRequest request, Long userId) {

        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new RuntimeException("Bình chọn không tồn tại"));

        validateCanUseRoom(poll.getRoomId(), userId);

        if (!Boolean.TRUE.equals(poll.getAllowAddOption())) {
            throw new RuntimeException("Bình chọn này không cho thêm lựa chọn");
        }

        if (Boolean.TRUE.equals(poll.getClosed())) {
            throw new RuntimeException("Bình chọn đã đóng");
        }

        if (request.getText() == null || request.getText().isBlank()) {
            throw new RuntimeException("Lựa chọn không được để trống");
        }

        PollOption option = PollOption.builder()
                .id(UUID.randomUUID().toString())
                .text(request.getText().trim())
                .createdBy(userId)
                .createdAt(LocalDateTime.now())
                .voters(new ArrayList<>())
                .build();

        poll.getOptions().add(option);

        Poll saved = pollRepository.save(poll);

        PollResponseDTO response = toResponse(saved, userId);

        messagingTemplate.convertAndSend(
                "/topic/chat/" + saved.getRoomId() + "/poll",
                response
        );

        return response;
    }

    // =========================
    // CLOSE POLL
    // =========================
    public PollResponseDTO closePoll(String pollId, Long userId) {

        Poll poll = pollRepository.findById(pollId)
                .orElseThrow(() -> new RuntimeException("Bình chọn không tồn tại"));

        validateCanUseRoom(poll.getRoomId(), userId);

        if (!poll.getCreatedBy().equals(userId)) {
            throw new RuntimeException("Chỉ người tạo bình chọn mới được đóng");
        }

        poll.setClosed(true);

        Poll saved = pollRepository.save(poll);

        PollResponseDTO response = toResponse(saved, userId);

        messagingTemplate.convertAndSend(
                "/topic/chat/" + saved.getRoomId() + "/poll",
                response
        );

        return response;
    }

    // =========================
    // MAP RESPONSE
    // =========================
    private PollResponseDTO toResponse(Poll poll, Long currentUserId) {

        boolean votedByMe = poll.getOptions().stream()
                .anyMatch(option -> option.getVoters() != null
                        && option.getVoters().contains(currentUserId));

        int totalVotes = poll.getOptions().stream()
                .mapToInt(option -> option.getVoters() == null ? 0 : option.getVoters().size())
                .sum();

        boolean shouldHideResult =
                Boolean.TRUE.equals(poll.getHideResultUntilVoted()) && !votedByMe;

        boolean shouldHideVoters = Boolean.TRUE.equals(poll.getAnonymous());

        List<Long> allVoterIds = poll.getOptions().stream()
                .filter(option -> option.getVoters() != null)
                .flatMap(option -> option.getVoters().stream())
                .distinct()
                .toList();

        Map<Long, User> userMap = userRepository.findAllById(allVoterIds)
                .stream()
                .collect(Collectors.toMap(User::getId, user -> user));

        List<PollOptionResponseDTO> optionResponses = poll.getOptions().stream()
                .map(option -> {
                    List<Long> voterIds = option.getVoters() == null
                            ? new ArrayList<>()
                            : option.getVoters();

                    boolean votedOptionByMe = voterIds.contains(currentUserId);

                    List<PollVoterDTO> voterDTOs;

                    if (shouldHideResult || shouldHideVoters) {
                        voterDTOs = new ArrayList<>();
                    } else {
                        voterDTOs = voterIds.stream()
                                .map(userMap::get)
                                .filter(user -> user != null)
                                .map(user -> PollVoterDTO.builder()
                                        .id(user.getId())
                                        .username(user.getUsername())
                                        .avatar(user.getAvatar())
                                        .build()
                                )
                                .toList();
                    }

                    return PollOptionResponseDTO.builder()
                            .id(option.getId())
                            .text(option.getText())
                            .createdBy(option.getCreatedBy())
                            .createdAt(option.getCreatedAt())
                            .voteCount(shouldHideResult ? 0 : voterIds.size())
                            .votedByMe(votedOptionByMe)
                            .voters(voterDTOs)
                            .build();
                })
                .toList();

        return PollResponseDTO.builder()
                .id(poll.getId())
                .roomId(poll.getRoomId())
                .question(poll.getQuestion())
                .createdBy(poll.getCreatedBy())
                .createdAt(poll.getCreatedAt())
                .expiresAt(poll.getExpiresAt())
                .closed(poll.getClosed())
                .multipleChoice(poll.getMultipleChoice())
                .allowAddOption(poll.getAllowAddOption())
                .anonymous(poll.getAnonymous())
                .hideResultUntilVoted(poll.getHideResultUntilVoted())
                .pinned(poll.getPinned())
                .votedByMe(votedByMe)
                .totalVotes(shouldHideResult ? 0 : totalVotes)
                .options(optionResponses)
                .build();
    }

    // =========================
    // CHECK ROOM PERMISSION
    // =========================
    private void validateCanUseRoom(String roomId, Long userId) {

        if (roomId != null && roomId.startsWith("group_")) {
            String groupId = roomId.replace("group_", "");

            boolean activeMember = memberRepo
                    .existsByGroupIdAndUserIdAndRemovedFalse(groupId, userId);

            if (!activeMember) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Bạn không thuộc nhóm hoặc đã bị xoá khỏi nhóm"
                );
            }
        }
    }
}