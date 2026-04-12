package com.chatapp.repository;

import com.chatapp.entity.Friendship;
import com.chatapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    @Query("""
        SELECT f FROM Friendship f
        WHERE 
        (f.senderId = :a AND f.receiverId = :b)
        OR
        (f.senderId = :b AND f.receiverId = :a)
    """)
    Optional<Friendship> findRelation(Long a, Long b);

    @Query("""
        SELECT f FROM Friendship f
        WHERE (f.senderId = :userId OR f.receiverId = :userId)
        AND f.status = 'ACCEPTED'
    """)
    List<Friendship> findFriends(Long userId);

    @Query("""
        SELECT f FROM Friendship f
        WHERE f.receiverId = :userId
        AND f.status = 'PENDING'
    """)
    List<Friendship> findRequests(Long userId);

    @Query("""
    SELECT u FROM User u
    WHERE (
        LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%'))
        OR u.phone LIKE CONCAT('%', :keyword, '%')
    )
    AND u.id <> :currentUserId
""")
    List<User> searchUsers(
            @Param("keyword") String keyword,
            @Param("currentUserId") Long currentUserId
    );

}
