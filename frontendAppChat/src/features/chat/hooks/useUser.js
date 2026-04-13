import { useEffect, useState, useCallback } from "react";
import { getMeApi } from "../../user/api/userApi";

function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Thêm trạng thái loading
  const [error, setError] = useState(null);

  // Dùng useCallback để hàm không bị tạo lại sau mỗi lần component re-render
  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMeApi();

      // Cách bóc tách dữ liệu linh hoạt của bạn khá tốt
      const userData = res.data?.data || res.data?.user || res.data;

      setUser(userData);
      setError(null);
    } catch (err) {
      console.error("Fetch User Error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]); // useEffect giờ chỉ cần gọi lại fetchUser

  return { user, loading, error, fetchUser };
}

export default useUser;
