import { useEffect, useState } from "react";
import { getMeApi } from "../../user/api/userApi";

function useUser() {
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    try {
      const res = await getMeApi();
      setUser(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchUser();
    };
    load();
  }, []);

  return { user, fetchUser };
}
export default useUser