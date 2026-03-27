package com.sliit.tg.service;

import com.sliit.tg.dto.SignupRequest;
import com.sliit.tg.dto.UpdateUserRequest;
import com.sliit.tg.model.User;
import com.sliit.tg.repo.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User registerUser(SignupRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(request.getEmail().trim());
        user.setPassword(request.getPassword());
        user.setPhone(request.getPhone().trim());
        user.setAge(request.getAge());
        return userRepository.save(user);
    }

    public Optional<User> loginUser(String email, String password) {
        return userRepository.findByEmailAndPassword(email.trim(), password);
    }

    public Optional<User> getUserById(Long id) {
        if (id == null) {
            return Optional.empty();
        }
        return userRepository.findById(id);
    }

    public User updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Optional<User> existing = userRepository.findByEmail(request.getEmail().trim());
        if (existing.isPresent() && !existing.get().getId().equals(id)) {
            throw new IllegalArgumentException("Email already exists");
        }

        user.setName(request.getName().trim());
        user.setEmail(request.getEmail().trim());
        user.setPhone(request.getPhone().trim());
        user.setAge(request.getAge());
        if (request.getProfilePhoto() != null) {
            user.setProfilePhoto(request.getProfilePhoto());
        }
        return userRepository.save(user);
    }

    public User updatePhoto(Long id, String photoData) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setProfilePhoto(photoData);
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        if (id != null) {
            userRepository.deleteById(id);
        }
    }
}
