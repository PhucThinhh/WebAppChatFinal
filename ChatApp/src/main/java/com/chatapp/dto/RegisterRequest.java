package com.chatapp.dto;

import com.chatapp.entity.Gender;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDate;

@Data
public class RegisterRequest {

    @NotBlank(message = "Tên không được để trống")
    private String username;

    @Email(message = "Email không hợp lệ")
    @NotBlank(message = "Email không được để trống")
    private String email;

    @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).{6,}$",
            message = "Mật khẩu phải >= 6 ký tự, có chữ hoa, số và ký tự đặc biệt"
    )
    private String password;

    @Pattern(regexp = "^(0|\\+84)[0-9]{9}$", message = "SĐT không hợp lệ")
    private String phone;

    @NotNull(message = "Giới tính không được để trống")
    private String gender;

    @NotNull(message = "Ngày sinh không được để trống")
    @Past(message = "Ngày sinh phải là quá khứ")
    private LocalDate birthday;
}