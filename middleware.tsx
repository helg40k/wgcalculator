// see https://next-auth.js.org/configuration/nextjs
// see https://nextjs.org/docs/app/building-your-application/routing/middleware

export { default } from "next-auth/middleware"

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).{1,})'],
}
