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
    <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[999] p-4">
      <div className="w-full max-w-[400px] bg-[#1e2124] rounded-lg overflow-hidden text-white shadow-2xl">
        {/* HEADER */}
        <div className="p-3 px-4 flex justify-between items-center border-b border-[#333]">
          <span className="font-semibold">Thông tin tài khoản</span>
          <span
            className="cursor-pointer text-[#b0b3b8] text-lg hover:text-white transition-colors"
            onClick={onClose}
          >
            ✖
          </span>
        </div>

        {/* COVER PHOTO */}
        <div
          className="h-40 bg-cover bg-center relative cursor-pointer group"
          style={{ backgroundImage: `url(${user.cover || DEFAULT_COVER_URL})` }}
          onClick={() => coverRef.current.click()}
        >
          <div className="absolute bottom-3 right-3 bg-black/50 p-2 rounded-full border border-white/20 group-hover:bg-black/70 transition-all">
            <FaCamera size={14} className="text-white" />
          </div>
        </div>

        {/* AVATAR & NAME */}
        <div className="flex items-end px-5 -mt-[50px] mb-5">
          <div
            className="relative inline-block cursor-pointer group"
            onClick={() => avatarRef.current.click()}
          >
            <img
              src={user.avatar || DEFAULT_AVATAR_URL}
              className="w-[100px] h-[100px] rounded-full border-4 border-[#1e2124] object-cover shadow-lg"
              alt="avatar"
            />
            <div className="absolute bottom-1 right-1 bg-[#2a2e33] rounded-full p-1.5 border-2 border-[#1e2124] group-hover:bg-[#3a3f45] transition-all">
              <FaCamera size={12} className="text-white" />
            </div>
          </div>
          <div className="ml-4 pb-1">
            <h3 className="text-lg font-semibold leading-tight">
              {user.username || "Phúc Thịnh"}
            </h3>
          </div>
        </div>

        {/* INFO SECTION */}
        <div className="px-5">
          <h4 className="text-white mb-4 text-base font-medium">
            Thông tin cá nhân
          </h4>
          <div className="grid grid-cols-[1fr_1.5fr] gap-2.5 mb-2.5 text-[#b0b3b8] text-sm">
            <span>Giới tính</span>
            <span className="text-white">{renderGender(user.gender)}</span>
            <span>Ngày sinh</span>
            <span className="text-white">
              {user.birthday || "01 tháng 01, 2007"}
            </span>
            <span>Điện thoại</span>
            <span className="text-white">
              {user.phone || "+84 947 579 831"}
            </span>
          </div>
          <p className="text-[12px] text-[#8a8d91] mt-4 leading-relaxed mb-5">
            Chỉ bạn bè có lưu số của bạn trong danh bạ máy xem được số này
          </p>
        </div>

        {/* UPDATE BUTTON */}
        <div className="p-5 pt-4 border-t border-[#333]">
          <button
            className="w-full flex items-center justify-center py-2.5 bg-transparent border border-[#3e4042] text-white rounded-full font-medium text-[15px] hover:bg-[#3e4042] transition-colors"
            onClick={() => setShowEdit(true)}
          >
            <span className="mr-2 text-base">✎</span> Cập nhật
          </button>
        </div>

        {/* HIDDEN INPUTS */}
        <input
          type="file"
          accept="image/*"
          ref={avatarRef}
          className="hidden"
          onChange={handleSelectAvatar}
        />
        <input
          type="file"
          accept="image/*"
          ref={coverRef}
          className="hidden"
          onChange={handleUploadCover}
        />
      </div>

      {/* CROP MODAL */}
      {showCrop && (
        <div className="fixed inset-0 bg-black/90 flex justify-center items-center z-[1000] p-4">
          <div className="w-full max-w-[420px] bg-[#242526] rounded-lg overflow-hidden shadow-2xl">
            <div className="p-4 text-center border-b border-[#3e4042] font-bold text-white">
              Cập nhật ảnh đại diện
            </div>
            <div className="h-[350px] relative bg-black">
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
            <div className="p-4 flex justify-end gap-3 bg-[#242526]">
              <button
                onClick={() => setShowCrop(false)}
                className="px-5 py-2 bg-transparent text-[#b0b3b8] border border-[#3e4042] rounded hover:bg-[#3a3b3c] transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleUploadAvatar}
                disabled={loading}
                className="px-5 py-2 bg-[#005ae0] text-white rounded font-semibold hover:bg-[#0064f0] disabled:opacity-50 transition-colors"
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

export default ProfileModal;
