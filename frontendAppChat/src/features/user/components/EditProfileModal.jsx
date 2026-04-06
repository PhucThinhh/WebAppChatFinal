import { useState } from "react";
import { updateUserApi } from "../api/userApi";

function EditProfileModal({ user, onClose, onSuccess }) {
  const [name, setName] = useState(user.username || "");
  const [gender, setGender] = useState(user.gender || "MALE");

  // ====== ĐỒNG BỘ NGÀY SINH TỪ USER ======
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
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <span style={styles.backBtn}>‹</span>
            <h3 style={styles.headerTitle}>Cập nhật thông tin cá nhân</h3>
          </div>
          <span style={styles.closeBtn} onClick={onClose}>
            ✖
          </span>
        </div>

        <div style={styles.body}>
          {/* TÊN HIỂN THỊ */}
          <div style={styles.section}>
            <label style={styles.label}>Tên hiển thị</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              placeholder="Nhập tên hiển thị"
            />
          </div>

          {/* THÔNG TIN CÁ NHÂN */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Thông tin cá nhân</h4>
            <div style={styles.genderRow}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="gender"
                  checked={gender === "MALE"}
                  onChange={() => setGender("MALE")}
                  style={styles.radioInput}
                />
                <span style={styles.radioDot}></span>
                Nam
              </label>

              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="gender"
                  checked={gender === "FEMALE"}
                  onChange={() => setGender("FEMALE")}
                  style={styles.radioInput}
                />
                <span style={styles.radioDot}></span>
                Nữ
              </label>
            </div>
          </div>

          {/* NGÀY SINH */}
          <div style={styles.section}>
            <label style={styles.label}>Ngày sinh</label>
            <div style={styles.dateGrid}>
              <select
                style={styles.select}
                value={day}
                onChange={(e) => setDay(e.target.value)}
              >
                {Array.from({ length: 31 }, (_, i) =>
                  String(i + 1).padStart(2, "0")
                ).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <select
                style={styles.select}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                {Array.from({ length: 12 }, (_, i) =>
                  String(i + 1).padStart(2, "0")
                ).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                style={styles.select}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              >
                {Array.from({ length: 100 }, (_, i) => 2026 - i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.btnCancel}>
            Hủy
          </button>
          <button onClick={handleSubmit} style={styles.btnSubmit}>
            Cập nhật
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2500,
  },
  modal: {
    width: "420px",
    background: "#242526",
    borderRadius: "12px",
    color: "#fff",
    overflow: "hidden",
    boxShadow: "0 12px 28px rgba(0,0,0,0.5)",
  },
  header: {
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #3e4042",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: "10px" },
  backBtn: {
    fontSize: "28px",
    cursor: "pointer",
    color: "#b0b3b8",
    lineHeight: "1",
  },
  headerTitle: { fontSize: "16px", fontWeight: "600", margin: 0 },
  closeBtn: { cursor: "pointer", color: "#b0b3b8", fontSize: "18px" },

  body: { padding: "20px" },
  section: { marginBottom: "24px" },
  label: {
    display: "block",
    fontSize: "14px",
    color: "#e4e6eb",
    marginBottom: "8px",
  },
  sectionTitle: {
    fontSize: "15px",
    fontWeight: "600",
    marginBottom: "15px",
    color: "#fff",
  },

  input: {
    width: "100%",
    padding: "10px 12px",
    background: "transparent",
    border: "1px solid #4e4f50",
    borderRadius: "6px",
    color: "#fff",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
  },

  genderRow: { display: "flex", gap: "30px" },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "15px",
  },
  radioInput: { width: "18px", height: "18px", accentColor: "#005ae0" },

  dateGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1.2fr",
    gap: "10px",
  },
  select: {
    padding: "10px",
    background: "transparent",
    border: "1px solid #4e4f50",
    borderRadius: "6px",
    color: "#fff",
    cursor: "pointer",
    outline: "none",
  },

  footer: {
    padding: "16px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    borderTop: "1px solid #3e4042",
  },
  btnCancel: {
    padding: "10px 24px",
    background: "#3a3b3c",
    color: "#e4e6eb",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
  },
  btnSubmit: {
    padding: "10px 24px",
    background: "#005ae0",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default EditProfileModal;
