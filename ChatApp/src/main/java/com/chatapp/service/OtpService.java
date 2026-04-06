package com.chatapp.service;

import com.chatapp.entity.Otp;
import com.chatapp.repository.OtpRepository;
import com.chatapp.service.EmailService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class OtpService {

    private final OtpRepository otpRepository;
    private final EmailService emailService;

    public OtpService(OtpRepository otpRepository, EmailService emailService) {
        this.otpRepository = otpRepository;
        this.emailService = emailService;
    }

    private String generateOtp() {
        return String.valueOf(new Random().nextInt(900000) + 100000);
    }

    public String sendOtp(String email) {

        Optional<Otp> optional = otpRepository.findTopByEmailOrderByCreatedAtDesc(email);

        Otp otp;

        if (optional.isPresent()) {
            otp = optional.get();
        } else {
            otp = new Otp();
            otp.setEmail(email);
        }

        String code = generateOtp();

        otp.setCode(code);
        otp.setCreatedAt(LocalDateTime.now());
        otp.setExpiredAt(LocalDateTime.now().plusMinutes(5));
        otp.setVerified(false);
        otp.setUsed(false);

        otpRepository.save(otp);

        emailService.sendOtp(email, code);

        return "OTP đã được gửi";
    }

    // 🔥 VERIFY OTP
    public String verifyOtp(String email, String inputOtp) {

        Otp otp = otpRepository
                .findTopByEmailOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy OTP"));

        if (otp.getUsed()) {
            throw new RuntimeException("OTP đã được sử dụng");
        }

        if (otp.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP đã hết hạn");
        }

        if (!otp.getCode().equals(inputOtp)) {
            throw new RuntimeException("OTP không đúng");
        }

        otp.setUsed(true);
        otp.setVerified(true);
        otpRepository.save(otp);

        return "Xác thực thành công";
    }
}