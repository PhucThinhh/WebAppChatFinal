package com.chatapp.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;

@RestController
@RequestMapping("/api/file")
public class FileController {

    private final String UPLOAD_DIR = "uploads/";

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();

            Path path = Paths.get(UPLOAD_DIR + fileName);
            Files.createDirectories(path.getParent());

            Files.write(path, file.getBytes());

            // 👉 trả về path tương đối để web/mobile tự map host phù hợp
            return ResponseEntity.ok("/uploads/" + fileName);

        } catch (Exception e) {
            return ResponseEntity.status(500).body("Upload failed");
        }
    }
}