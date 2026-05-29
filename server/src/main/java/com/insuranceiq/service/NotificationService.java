package com.insuranceiq.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class NotificationService {

    @Value("${app.notification-service.url}")
    private String notificationServiceUrl;

    /**
     * Sends a notification event to the Node.js Socket.IO server.
     * If the server is unavailable, logs the event and continues silently.
     */
    public void sendEvent(String eventType, String message) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", eventType);
            payload.put("message", message);
            payload.put("timestamp", System.currentTimeMillis());

            restTemplate.postForObject(notificationServiceUrl + "/emit", payload, String.class);
            log.info("Notification sent: [{}] {}", eventType, message);
        } catch (Exception e) {
            // Socket.IO server is optional — log and continue
            log.debug("Notification service unavailable, skipping event [{}]: {}", eventType, message);
        }
    }
}
