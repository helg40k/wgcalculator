// see https://next-auth.js.org/configuration/nextjs
// see https://nextjs.org/docs/app/building-your-application/routing/middleware

import { withAuth } from "next-auth/middleware";

// Export the middleware function as default
export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    // Add any custom middleware logic here if needed
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

export const config = {
  // matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).{1,})"],
  matcher: ["/admin/:path*", "/:path*/admin/:path*"],
};
