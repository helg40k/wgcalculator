export { auth as proxy } from "@/auth";

export const config = {
  matcher: ["/admin/:path*", "/:path*/admin/:path*"],
};
