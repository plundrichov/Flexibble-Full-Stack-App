import { getServerSession } from "next-auth/next";
import { NextAuthOptions, User } from "next-auth";
import { AdapterUser } from "next-auth/adapters";
import GoogleProvider from "next-auth/providers/google";
import jsonwebtoken from "jsonwebtoken";
import { JWT } from "next-auth/jwt";
import { getUser, createUser } from "./actions";
import { UserProfile } from "./../common.types";

import { SessionInterface } from "@/common.types";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  jwt: {
    encode: ({ secret, token }) => {
      console.log(token, "__________token to encode");
      const encodedToken = jsonwebtoken.sign(
        {
          ...token,
          iss: "grafbase",
          exp: Math.floor(Date.now() / 1000) + 60 * 60,
        },
        secret
      );
      console.log(encodedToken, "_________encodedToken");
      return encodedToken;
    },
    decode: async ({ secret, token }) => {
      console.log(token, "__________token to decode");
      console.log(secret, "___________secret");
      const decodedToken = jsonwebtoken.verify(token!, secret);
      console.log(decodedToken, "_________decodedToken");
      return decodedToken as JWT;
    },
  },
  theme: {
    colorScheme: "light",
    logo: "/logo.svg",
  },
  callbacks: {
    async session({ session }) {
      const email = session?.user?.email as string;

      try {
        const data = (await getUser(email)) as { user?: UserProfile };

        const newSession = {
          ...session,
          user: {
            ...session.user,
            ...data?.user,
          },
        };
        return newSession;
      } catch (error) {
        console.log("Error retrieving user data", error);
        return session;
      }
    },
    async signIn({ user }: { user: AdapterUser | User }) {
      try {
        // get the user if they exist
        const userExists = (await getUser(user?.email as string)) as {
          user?: UserProfile;
        };

        if (!userExists.user) {
          await createUser(
            user.name as string,
            user.email as string,
            user.image as string
          );
        }

        return true;
      } catch (error: any) {
        console.log(error);
        return false;
      }
    },
  },
};

export async function getCurrentUser() {
  const session = (await getServerSession(authOptions)) as SessionInterface;

  return session;
}
