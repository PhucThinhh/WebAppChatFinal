import { useState } from "react";
import { updateUserApi } from "../api/userApi";

function EditProfileModal({ user, onClose, onSuccess }) {
  const [name, setName] = useState(user.username || "");
  const [gender, setGender] = useState(user.gender || "MALE");

  // ====== ĐỒNG BỘ NGÀY SINH ======
  const getDate = () => {
    const date = user?.birthday || user?.dob;
    if (!date) return { y: "2000", m: "01", d: "01" };
    const [y, m, d] = date.split("-");
    return { y, m, d };
  };

  const { y, m, d } = getDate();
  const [year, setYear] = useState(y);
  const [month, setMonth] = useState(m);
  const [day, setDay] = useState(d);

  const handleSubmit = async () => {
    const birthday = `${year}-${month}-${day}`;
    try {
      await updateUserApi({
        username: name,
        gender,
        birthday,
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[2500]">
      <div className="w-[420px] bg-[#242526] rounded-xl text-white overflow-hidden shadow-[0_12px_28px_rgba(0,0,0,0.5)]">
        
        {/* HEADER */}
        <div className="p-4 flex justify-between items-center border-b border-[#3e4042]">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl cursor-pointer text-[#b0b3b8] leading-none">‹</span>
            <h3 className="text-base font-semibold">Cập nhật thông tin cá nhân</h3>
          </div>
          <span 
            className="cursor-pointer text-[#b0b3b8] text-lg hover:text-white transition-colors" 
            onClick={onClose}
          >
            ✖
          </span>
        </div>

        <div className="p-5">
          {/* TÊN HIỂN THỊ */}
          <div className="mb-6">
            <label className="block text-sm text-[#e4e6eb] mb-2">Tên hiển thị</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-transparent border border-[#4e4f50] rounded-md text-white text-[15px] outline-none focus:border-[#005ae0] transition-colors"
              placeholder="Nhập tên hiển thị"
            />
          </div>

          {/* THÔNG TIN CÁ NHÂN */}
          <div className="mb-6">
            <h4 className="text-[15px] font-semibold mb-4">Thông tin cá nhân</h4>
            <div className="flex gap-8">
              <label className="flex items-center gap-2 cursor-pointer text-[15px]">
                <input
                  type="radio"
                  name="gender"
                  checked={gender === "MALE"}
                  onChange={() => setGender("MALE")}
                  className="w-[18px] height-[18px] accent-[#005ae0]"
                />
                Nam
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[15px]">
                <input
                  type="radio"
                  name="gender"
                  checked={gender === "FEMALE"}
                  onChange={() => setGender("FEMALE")}
                  className="w-[18px] height-[18px] accent-[#005ae0]"
                />
                Nữ
              </label>
            </div>
          </div>

          {/* NGÀY SINH */}
          <div className="mb-6">
            <label className="block text-sm text-[#e4e6eb] mb-2">Ngày sinh</label>
            <div className="grid grid-cols-[1fr_1fr_1.2fr] gap-2.5">
              <select
                className="p-2.5 bg-transparent border border-[#4e4f50] rounded-md text-white cursor-pointer outline-none focus:border-[#005ae0]"
                value={day}
                onChange={(e) => setDay(e.target.value)}
              >
                {Array.from({ length: 31 }, (_, i) =>
                  String(i + 1).padStart(2, "0")
                ).map((val) => (
                  <option key={val} value={val} className="bg-[#242526]">
                    {val}
                  </option>
                ))}
              </select>

              <select
                className="p-2.5 bg-transparent border border-[#4e4f50] rounded-md text-white cursor-pointer outline-none focus:border-[#005ae0]"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                {Array.from({ length: 12 }, (_, i) =>
                  String(i + 1).padStart(2, "0")
                ).map((val) => (
                  <option key={val} value={val} className="bg-[#242526]">
                    {val}
                  </option>
                ))}
              </select>

              <select
                className="p-2.5 bg-transparent border border-[#4e4f50] rounded-md text-white cursor-pointer outline-none focus:border-[#005ae0]"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                {Array.from({ length: 100 }, (_, i) => 2026 - i).map((val) => (
                  <option key={val} value={val} className="bg-[#242526]">
                    {val}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 flex justify-end gap-3 border-t border-[#3e4042]">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 bg-[#3a3b3c] hover:bg-[#4e4f50] text-[#e4e6eb] rounded-md font-semibold transition-colors"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit} 
            className="px-6 py-2.5 bg-[#005ae0] hover:bg-[#0064f0] text-white rounded-md font-semibold transition-colors"
          >
            Cập nhật
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditProfileModal;