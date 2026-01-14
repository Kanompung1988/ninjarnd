import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
      httpOptions: {
        timeout: 10000, // Increase timeout to 10 seconds
      },
      // Explicitly set wellKnown URL to avoid discovery timeout
      wellKnown: 'https://accounts.google.com/.well-known/openid-configuration',
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  // Add debug logging
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}
