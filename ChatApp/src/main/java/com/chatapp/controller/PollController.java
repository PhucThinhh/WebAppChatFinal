package com.chatapp.controller;

import com.chatapp.dto.AddPollOptionRequest;
import com.chatapp.dto.CreatePollRequest;
import com.chatapp.dto.PollResponseDTO;
import com.chatapp.dto.VotePollRequest;
import com.chatapp.service.PollService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat/polls")
public class PollController {

    private final PollService pollService;

    // =========================
    // CREATE POLL
    // =========================
    @PostMapping
    public PollResponseDTO createPoll(
            @RequestBody CreatePollRequest request,
            Principal principal
    ) {
        Long userId = Long.parseLong(principal.getName());

        return pollService.createPoll(request, userId);
    }

    // =========================
    // GET POLL
    // =========================
    @GetMapping("/{pollId}")
    public PollResponseDTO getPoll(
            @PathVariable String pollId,
            Principal principal
    ) {
        Long userId = Long.parseLong(principal.getName());

        return pollService.getPoll(pollId, userId);
    }

    // =========================
    // VOTE POLL
    // =========================
    @PostMapping("/{pollId}/vote")
    public PollResponseDTO votePoll(
            @PathVariable String pollId,
            @RequestBody VotePollRequest request,
            Principal principal
    ) {
        Long userId = Long.parseLong(principal.getName());

        return pollService.votePoll(pollId, request, userId);
    }

    // =========================
    // ADD OPTION
    // =========================
    @PostMapping("/{pollId}/options")
    public PollResponseDTO addOption(
            @PathVariable String pollId,
            @RequestBody AddPollOptionRequest request,
            Principal principal
    ) {
        Long userId = Long.parseLong(principal.getName());

        return pollService.addOption(pollId, request, userId);
    }

    // =========================
    // CLOSE POLL
    // =========================
    @PutMapping("/{pollId}/close")
    public PollResponseDTO closePoll(
            @PathVariable String pollId,
            Principal principal
    ) {
        Long userId = Long.parseLong(principal.getName());

        return pollService.closePoll(pollId, userId);
    }
}