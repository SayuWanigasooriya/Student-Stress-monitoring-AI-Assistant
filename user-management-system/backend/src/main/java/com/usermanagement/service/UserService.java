package com.usermanagement.service;

import com.usermanagement.model.User;
import com.usermanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;

    public User registerUser(User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        return userRepository.save(user);
    }

    public Optional<User> loginUser(String email, String password) {
        return userRepository.findByEmailAndPassword(email, password);
    }

    public Optional<User> getUserById(Long id) {
        if (id == null) return Optional.empty();
        return userRepository.findById(id);
    }

    public User updateUser(Long id, User userDetails) {
        if (id == null) throw new RuntimeException("Invalid user ID");
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setName(userDetails.getName());
        user.setEmail(userDetails.getEmail());
        user.setPhone(userDetails.getPhone());
        user.setAge(userDetails.getAge());
        if (userDetails.getProfilePhoto() != null) {
            user.setProfilePhoto(userDetails.getProfilePhoto());
        }
        
        return userRepository.save(user);
    }

    public User updatePhoto(Long id, String photoData) {
        if (id == null) throw new RuntimeException("Invalid user ID");
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setProfilePhoto(photoData); // null clears the photo
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        if (id != null) {
            userRepository.deleteById(id);
        }
    }
}
