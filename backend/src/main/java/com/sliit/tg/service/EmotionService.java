package com.sliit.tg.service;

import com.sliit.tg.dto.EmotionRequest;
import com.sliit.tg.dto.EmotionResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class EmotionService {

    private final String emotionApiUrl;
    private final RestTemplate restTemplate = new RestTemplate();

    public EmotionService(
            @Value("${app.emotion.api-url:http://127.0.0.1:8001/predict}") String emotionApiUrl
    ) {
        this.emotionApiUrl = emotionApiUrl;
    }

    public EmotionResponse detectEmotion(String text) {
        try {
            EmotionRequest requestBody = new EmotionRequest(text);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<EmotionRequest> request = new HttpEntity<>(requestBody, headers);

            ResponseEntity<EmotionResponse> response = restTemplate.exchange(
                    emotionApiUrl,
                    HttpMethod.POST,
                    request,
                    EmotionResponse.class
            );

            return response.getBody();
        } catch (Exception e) {
            EmotionResponse fallback = new EmotionResponse();
            fallback.setEmotion("neutral");
            fallback.setScore(0.0);
            return fallback;
        }
    }
}
