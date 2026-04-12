import { useEffect, useState } from "react";
import { getMeApi } from "../../user/api/userApi";

function useUser() {
  const [user, setUser] = useState(null);

  const fetchUser = async () => {
    try {
      const res = await getMeApi();

      const userData = res.data?.data || res.data?.user || res.data;

      setUser(userData);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getMeApi();

        const userData = res.data?.data || res.data?.user || res.data;

        setUser(userData);
      } catch (err) {
        console.log(err);
      }
    };

    load();
  }, []);


  return { user, fetchUser };
}

export default useUser;
