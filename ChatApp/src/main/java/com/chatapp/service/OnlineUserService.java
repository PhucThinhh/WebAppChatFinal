package com.chatapp.service;

import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class OnlineUserService {

    private final ConcurrentHashMap<String, AtomicInteger> connectionCounts = new ConcurrentHashMap<>();

    public boolean connect(String userId) {
        AtomicInteger count = connectionCounts.computeIfAbsent(userId, ignored -> new AtomicInteger(0));
        return count.incrementAndGet() == 1;
    }

    public boolean disconnect(String userId) {
        AtomicInteger count = connectionCounts.get(userId);
        if (count == null) {
            return false;
        }

        if (count.decrementAndGet() <= 0) {
            connectionCounts.remove(userId);
            return true;
        }

        return false;
    }

    public Set<String> getOnlineUsers() {
        return Set.copyOf(connectionCounts.keySet());
    }
}
