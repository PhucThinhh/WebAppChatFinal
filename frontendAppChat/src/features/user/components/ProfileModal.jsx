import { useEffect, useState, useRef } from "react";
import Cropper from "react-easy-crop";
import { FaCamera } from "react-icons/fa";
import { getMeApi, uploadAvatarApi, uploadCoverApi } from "../api/userApi";
import EditProfileModal from "./EditProfileModal";

const DEFAULT_COVER_URL =
  "https://images.unsplash.com/photo-1596701062351-86f84cc896c1?q=80&w=1000";
const DEFAULT_AVATAR_URL =
  "https://images.unsplash.com/photo-1549488344-a1_f1c5c56d2?q=80&w=400";

function ProfileModal({ onClose, refreshUser }) {
  const [user, setUser] = useState(null);
  const avatarRef = useRef();
  const coverRef = useRef();

  const [preview, setPreview] = useState(null);
  const [showCrop, setShowCrop] = useState(false);
  const [loading, setLoading] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showEdit, setShowEdit] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await getMeApi();
      const data = res.data;
      setUser({
        ...data,
        cover: data.coverImage,
        dob: data.birthday,
      });
    } catch (err) {
      console.error("Lỗi lấy thông tin:", err);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Hàm chuyển đổi giới tính sang tiếng Việt
  const renderGender = (gender) => {
    if (gender === "MALE") return "Nam";
    if (gender === "FEMALE") return "Nữ";
    return gender || "Chưa cập nhật";
  };

  const handleSelectAvatar = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setShowCrop(true);
  };

  const onCropComplete = (_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = new Image();
    image.src = imageSrc;
    image.setAttribute("crossOrigin", "anonymous");
    await new Promise((resolve) => (image.onload = resolve));
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg");
    });
  };

  const handleUploadAvatar = async () => {
    if (!croppedAreaPixels) return;
    setLoading(true);
    try {
      const blob = await getCroppedImg(preview, croppedAreaPixels);
      const formData = new FormData();
      formData.append("file", blob, "avatar.jpg");
      const res = await uploadAvatarApi(formData);
      setUser((prev) => ({ ...prev, avatar: res.data }));
      setShowCrop(false);
      setPreview(null);
      refreshUser();
    } catch (err) {
      console.error("Upload avatar lỗi:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCover = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await uploadCoverApi(formData);
      setUser((prev) => ({ ...prev, cover: res.data }));
    } catch (err) {
      console.error("Upload cover lỗi:", err);
    }
  };

  if (!user) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <span style={{ fontWeight: "600" }}>Thông tin tài khoản</span>
          <span style={styles.close} onClick={onClose}>
            ✖
          </span>
        </div>

        <div
          style={{
            ...styles.cover,
            backgroundImage: `url(${user.cover || DEFAULT_COVER_URL})`,
          }}
          onClick={() => coverRef.current.click()}
        >
          <div style={styles.coverIcon}>
            <FaCamera size={14} color="white" />
          </div>
        </div>

        <div style={styles.profileInfoHorizontal}>
          <div
            style={styles.avatarWrapper}
            onClick={() => avatarRef.current.click()}
          >
            <img
              src={user.avatar || DEFAULT_AVATAR_URL}
              style={styles.avatar}
              alt="avatar"
            />
            <div style={styles.cameraIcon}>
              <FaCamera size={12} color="white" />
            </div>
          </div>
          <div style={styles.nameContainer}>
            <h3 style={styles.username}>{user.username || "Phúc Thịnh"}</h3>
          </div>
        </div>

        <div style={styles.info}>
          <h4 style={{ color: "#fff", marginBottom: "15px", fontSize: "16px" }}>
            Thông tin cá nhân
          </h4>
          <div style={styles.infoGrid}>
            <div style={styles.infoLabel}>Giới tính</div>
            <div style={styles.infoValue}>{renderGender(user.gender)}</div>
            <div style={styles.infoLabel}>Ngày sinh</div>
            <div style={styles.infoValue}>
              {user.birthday || "01 tháng 01, 2007"}
            </div>
            <div style={styles.infoLabel}>Điện thoại</div>
            <div style={styles.infoValue}>
              {user.phone || "+84 947 579 831"}
            </div>
          </div>
          <p style={styles.privacyNote}>
            Chỉ bạn bè có lưu số của bạn trong danh bạ máy xem được số này
          </p>
        </div>

        {/* NÚT CẬP NHẬT ĐÃ SỬA CSS */}
        <div style={styles.btnWrapper}>
          <button style={styles.btnUpdate} onClick={() => setShowEdit(true)}>
            <span style={styles.editBtnIcon}>✎</span> Cập nhật
          </button>
        </div>

        <input
          type="file"
          accept="image/*"
          ref={avatarRef}
          style={{ display: "none" }}
          onChange={handleSelectAvatar}
        />
        <input
          type="file"
          accept="image/*"
          ref={coverRef}
          style={{ display: "none" }}
          onChange={handleUploadCover}
        />
      </div>

      {showCrop && (
        <div style={styles.cropOverlay}>
          <div style={styles.cropContainer}>
            <div style={styles.cropHeader}>Cập nhật ảnh đại diện</div>
            <div style={styles.cropBody}>
              <Cropper
                image={preview}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div style={styles.cropFooter}>
              <button
                onClick={() => setShowCrop(false)}
                style={styles.btnCancel}
              >
                Hủy
              </button>
              <button
                onClick={handleUploadAvatar}
                style={styles.btnSave}
                disabled={loading}
              >
                {loading ? "Đang lưu..." : "Lưu ảnh"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showEdit && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEdit(false)}
          onSuccess={fetchUser}
        />
      )}
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },
  modal: {
    width: "400px",
    background: "#1e2124",
    borderRadius: "8px",
    overflow: "hidden",
    color: "#fff",
  },
  header: {
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #333",
  },
  close: { cursor: "pointer", color: "#b0b3b8", fontSize: "18px" },
  cover: {
    height: "160px",
    backgroundSize: "cover",
    backgroundPosition: "center",
    position: "relative",
    cursor: "pointer",
  },
  coverIcon: {
    position: "absolute",
    bottom: "12px",
    right: "12px",
    background: "rgba(0,0,0,0.5)",
    padding: "8px",
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.2)",
  },
  profileInfoHorizontal: {
    display: "flex",
    alignItems: "flex-end",
    padding: "0 20px",
    marginTop: "-60px",
    marginBottom: "20px",
  },
  avatarWrapper: {
    position: "relative",
    display: "inline-block",
    cursor: "pointer",
  },
  avatar: {
    width: "100px",
    height: "100px",
    borderRadius: "50%",
    border: "4px solid #1e2124",
    objectFit: "cover",
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
  },
  cameraIcon: {
    position: "absolute",
    bottom: "5px",
    right: "5px",
    background: "#2a2e33",
    borderRadius: "50%",
    padding: "6px",
    border: "2px solid #1e2124",
  },
  nameContainer: {
    display: "flex",
    alignItems: "center",
    marginLeft: "15px",
    paddingBottom: "5px",
  },
  username: { margin: 0, fontSize: "18px", fontWeight: "600" },
  info: { padding: "0 20px" },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1.5fr",
    gap: "10px",
    marginBottom: "10px",
    color: "#b0b3b8",
  },
  infoLabel: { fontSize: "14px" },
  infoValue: { fontSize: "14px", color: "white" },
  privacyNote: {
    fontSize: "12px",
    color: "#8a8d91",
    marginTop: "10px",
    lineHeight: "1.4",
    marginBottom: "20px",
  },

  // CSS NÚT CẬP NHẬT MỚI
  btnWrapper: {
    padding: "0 20px 20px 20px",
    borderTop: "1px solid #333",
    paddingTop: "15px",
  },
  btnUpdate: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px",
    background: "transparent", // Nền trong suốt hoặc tối theo Zalo
    border: "1px solid #3e4042",
    color: "#fff",
    borderRadius: "20px", // Bo tròn nhiều hơn giống nút hiện đại
    cursor: "pointer",
    fontWeight: "500",
    fontSize: "15px",
    transition: "background 0.2s",
  },
  editBtnIcon: { marginRight: "8px", fontSize: "16px" },

  cropOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.9)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  cropContainer: {
    width: "420px",
    background: "#242526",
    borderRadius: "8px",
    overflow: "hidden",
  },
  cropHeader: {
    padding: "15px",
    textAlign: "center",
    borderBottom: "1px solid #3e4042",
    fontWeight: "bold",
  },
  cropBody: { height: "350px", position: "relative", background: "#000" },
  cropFooter: {
    padding: "15px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
  btnSave: {
    padding: "8px 20px",
    background: "#005ae0",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "600",
  },
  btnCancel: {
    padding: "8px 20px",
    background: "transparent",
    color: "#b0b3b8",
    border: "1px solid #3e4042",
    borderRadius: "4px",
    cursor: "pointer",
  },
};

export default ProfileModal;
