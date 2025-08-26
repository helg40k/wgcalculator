import { useMemo } from "react";
import { useSession } from "next-auth/react";

const useUser = () => {
  const { data, status } = useSession();

  const isAuthenticated = useMemo(() => "authenticated" === status, [status]);
  const userName = useMemo(
    () => (isAuthenticated && data?.user?.name ? data.user.name : "anonymous"),
    [isAuthenticated, data],
  );
  const iconURL = useMemo(
    () => (isAuthenticated && data?.user?.image ? data.user.image : undefined),
    [isAuthenticated, data],
  );
  const email = useMemo(
    () => (isAuthenticated && data?.user?.email ? data.user.email : null),
    [isAuthenticated, data],
  );
  const isAdmin = useMemo(
    () => isAuthenticated && !!(data?.user as any)?.admin,
    [isAuthenticated, data],
  );

  return { email, iconURL, isAdmin, isAuthenticated, userName };
};

export default useUser;
