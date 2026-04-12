package com.chatapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .setHandshakeHandler(new DefaultHandshakeHandler() {
                    @Override
                    protected Principal determineUser(
                            org.springframework.http.server.ServerHttpRequest request,
                            org.springframework.web.socket.WebSocketHandler wsHandler,
                            java.util.Map<String, Object> attributes) {

                        String query = request.getURI().getQuery();
                        String userId = "anonymous";

                        if (query != null) {
                            for (String param : query.split("&")) {
                                String[] kv = param.split("=");
                                if (kv.length == 2 && kv[0].equals("userId")) {
                                    userId = kv[1].trim();
                                }
                            }
                        }

                        String finalUserId = userId;

                        return () -> finalUserId;
                    }
                })
                .withSockJS();
    }
}
