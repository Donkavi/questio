import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "google") {
                await dbConnect();
                try {
                    const existingUser = await User.findOne({ email: user.email });
                    if (!existingUser) {
                        await User.create({
                            email: user.email,
                            name: user.name,
                            image: user.image,
                        });
                    }
                    return true;
                } catch (error) {
                    console.error("Error saving user", error);
                    return false;
                }
            }
            return true;
        },
        async session({ session }) {
            await dbConnect();
            if (session.user?.email) {
                const dbUser = await User.findOne({ email: session.user.email });
                if (dbUser) {
                    (session as any).user.id = dbUser._id.toString();
                }
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/auth/signin"
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
