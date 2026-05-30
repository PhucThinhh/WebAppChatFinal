# WebAppChatFinal - bản nâng cấp giao diện + tính năng

## Điểm đã nâng cấp

- Giao diện chat sáng hơn, hiện đại hơn, phong cách gần Zalo.
- Sidebar, danh sách hội thoại, header chat, bubble tin nhắn, ô nhập tin nhắn được làm lại.
- Sửa xử lý link ảnh/avatar để nối đúng backend `http://localhost:8080`.
- Thêm nút gọi thoại và gọi video trong header chat.
- Thêm modal gọi thoại/video dùng `getUserMedia()` để mở micro/camera trên trình duyệt.
- Thêm AI Safe Chat chặn tin nhắn có từ ngữ toxic/chửi bậy ở frontend.
- Thêm `ToxicModerationService` ở backend để chặn thêm một lớp khi gửi qua socket.

## Lưu ý về gọi thoại/video

Bản này đã có giao diện gọi thoại/video và mở camera/micro local. Để gọi thật giữa 2 tài khoản/2 máy cần bổ sung signaling WebRTC đầy đủ qua WebSocket/STOMP và trao đổi SDP/ICE candidate.

## Cấu hình cần sửa trước khi chạy

Mở file:

```text
ChatApp/src/main/resources/application.properties
```

Sửa các giá trị placeholder:

```properties
spring.mail.username=YOUR_EMAIL@gmail.com
spring.mail.password=YOUR_GMAIL_APP_PASSWORD
aws.accessKey=YOUR_AWS_ACCESS_KEY
aws.secretKey=YOUR_AWS_SECRET_KEY
aws.bucketName=YOUR_BUCKET_NAME
gemini.api.key=YOUR_GEMINI_API_KEY
```

Không commit key thật lên GitHub.

## Chạy project

### Backend

```powershell
cd ChatApp
docker compose up -d
.\mvnw.cmd spring-boot:run
```

Swagger:

```text
http://localhost:8080/swagger-ui/index.html
```

### Frontend

```powershell
cd frontendAppChat
npm install
npm run dev
```

Web:

```text
http://localhost:5173
```
