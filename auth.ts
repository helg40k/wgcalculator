import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth } = NextAuth({
  callbacks: {
    authorized({ auth: currentSession }) {
      return !!currentSession?.user;
    },
    async session({ session }) {
      const email = session?.user?.email;
      if (email) {
        const adminEmailList = process.env.ADMIN_EMAIL_LIST;
        if (adminEmailList && adminEmailList.includes(email)) {
          session.user.admin = true;
        }
      }
      return session;
    },
    async signIn({ user }) {
      return !!user?.email;
    },
  },
  logger: {
    error(error: Error) {
      console.error("NextAuth error!", error);
    },
  },
  pages: {
    error: "/",
    signIn: "/",
    signOut: "/",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
});
