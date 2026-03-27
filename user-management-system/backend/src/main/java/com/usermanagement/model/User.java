package com.usermanagement.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    
    @Column(unique = true)
    private String email;
    
    private String password;
    private String phone;
    private Integer age;

    @Column(name = "profile_photo", columnDefinition = "LONGTEXT")
    private String profilePhoto;

    public User() {}

    public User(String name, String email, String password, String phone, Integer age) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.phone = phone;
        this.age = age;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getProfilePhoto() { return profilePhoto; }
    public void setProfilePhoto(String profilePhoto) { this.profilePhoto = profilePhoto; }
}
