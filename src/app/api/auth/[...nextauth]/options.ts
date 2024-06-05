import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import dbConnect from "@/lib/dbConnect"
import UserModel from "@/model/User"

export const authOptions : NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: 'credentials',
            name: 'Crendtials',
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
              },
              async authorize(credentials: any) : Promise<any>{
                await dbConnect()
                try {
                    const user = await UserModel.findOne({
                        $or: [
                            { email: credentials.identifier},
                            { username: credentials.identifier},
                        ],
                    });
                    if (!user) {
                        throw new Error('No user found with this email');
                      }
                      if (!user.isVerified) {
                        throw new Error('Please verify your account before logging in');
                      }
                      const isPasswordCorrect = await bcrypt.compare(
                        credentials.password,
                        user.password
                      );
                      if (isPasswordCorrect) {
                        return user;
                      } else {
                        throw new Error('Incorrect password');
                      }
                    } catch (err: any) {
                      throw new Error(err);
                    
                }
              }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token._id = user._id?.toString()
                token.isVerified = user.isVerified;
                token.isAcceptingMessages = user.isAcceptingMessages;
                token.username = user.username
            }

            return token
        },
        async session({ session, token }) {
            return session
        },
    },

    pages: {
        signIn: '/sign-in'
    },
    session: {
        strategy: "jwt"
    },
    secret: process.env.NEXTAUTH_SECRET,
    
}