package com.chatapp.service;

import com.chatapp.dto.FriendResponseDTO;
import com.chatapp.dto.UserSearchDTO;
import com.chatapp.entity.Friendship;
import com.chatapp.entity.User;
import com.chatapp.mapper.FriendshipMapper;
import com.chatapp.repository.FriendshipRepository;
import com.chatapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FriendshipService {

    private final FriendshipRepository repo;
    private final UserRepository userRepo;

    // 🔥 GỬI LỜI MỜI
    public void sendRequest(Long senderId, Long receiverId) {

        if (senderId.equals(receiverId)) {
            throw new RuntimeException("Không thể tự kết bạn");
        }

        if (repo.findRelation(senderId, receiverId).isPresent()) {
            throw new RuntimeException("Đã tồn tại quan hệ");
        }

        Friendship f = Friendship.builder()
                .senderId(senderId)
                .receiverId(receiverId)
                .status(Friendship.Status.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        repo.save(f);
    }

    // ✅ CHẤP NHẬN
    public void accept(Long id) {
        Friendship f = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lời mời"));

        f.setStatus(Friendship.Status.ACCEPTED);
        repo.save(f);
    }

    // ❌ TỪ CHỐI
    public void reject(Long id) {
        Friendship f = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lời mời"));

        f.setStatus(Friendship.Status.REJECTED);
        repo.save(f);
    }

    // 👥 DANH SÁCH BẠN
    public List<FriendResponseDTO> getFriends(Long userId) {

        return repo.findFriends(userId).stream().map(f -> {

            Long friendId = f.getSenderId().equals(userId)
                    ? f.getReceiverId()
                    : f.getSenderId();

            User u = userRepo.findById(friendId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            return FriendshipMapper.toDTO(f, u);

        }).toList();
    }

    // 📩 DANH SÁCH LỜI MỜI
    public List<FriendResponseDTO> getRequests(Long userId) {

        return repo.findRequests(userId).stream().map(f -> {

            User u = userRepo.findById(f.getSenderId())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            return FriendshipMapper.toDTO(f, u);

        }).toList();
    }

    // 🔍 SEARCH USER (FIX TỐI ƯU)
    public List<UserSearchDTO> searchUsers(String keyword, Long currentUserId) {

        if (keyword == null || keyword.isBlank()) return List.of();

        String k = keyword.toLowerCase();

        List<User> users = userRepo.findAll();

        return users.stream()
                .filter(user -> !user.getId().equals(currentUserId))
                .filter(user ->
                        (user.getUsername() != null && user.getUsername().toLowerCase().contains(k)) ||
                                (user.getPhone() != null && user.getPhone().contains(k)) ||
                                (user.getEmail() != null && user.getEmail().toLowerCase().contains(k))
                )
                .map(user -> {

                    Friendship f = repo
                            .findRelation(currentUserId, user.getId())
                            .orElse(null);

                    String status = "NONE";

                    if (f != null) {
                        if (f.getStatus() == Friendship.Status.ACCEPTED) {
                            status = "FRIEND";
                        } else if (f.getStatus() == Friendship.Status.PENDING) {
                            status = "PENDING";
                        }
                    }

                    return new UserSearchDTO(
                            user.getId(),
                            user.getUsername(),
                            user.getAvatar(),
                            status
                    );
                })
                .toList();
    }
}