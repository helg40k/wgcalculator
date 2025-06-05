// see https://dev.to/peterlidee/full-guide-for-authentication-with-next-14-nextauth-4-strapi-v4-using-google-and-credentials-provider-7jh
// also https://medium.com/@nithishreddy0627/step-by-step-guide-building-a-next-js-63cd5b2bbbf3
// and https://www.youtube.com/watch?v=k1TL-AzavvY

import NextAuth from 'next-auth';
import GoogleProvider from "next-auth/providers/google";

export default NextAuth( {
  pages: {
    signIn: '/',
    signOut: '/',
    error: '/',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  secret: process.env.NEXTAUTH_SECRET!,
  callbacks: {
    async signIn({user, account, profile}) {
      const email = user?.email;
      if (!email) {
        return false;
      }

      // any logic to authorize just signed in user should be here

      console.log('== SUCCESS ==')
      return true;
    }
  },
  logger: {
    async error(code, metadata) {
      console.error(`NextAuth error! Code: ${code}`, metadata);
    },
  },
});
