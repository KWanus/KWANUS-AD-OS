import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Gets the Prisma User record for the current Clerk user.
 * Creates the record if it doesn't exist yet (first-time sync).
 */
export async function getOrCreateUser() {
    const { userId: clerkId } = await auth();
    if (!clerkId) return null;

    // Try to find existing
    let user = await prisma.user.findUnique({
        where: { clerkId },
    });

    // If not found, create it (sync Clerk data)
    if (!user) {
        const clerkUser = await currentUser();
        if (!clerkUser) return null;

        const email = clerkUser.emailAddresses[0]?.emailAddress;
        const name = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim();

        if (!email) return null;

        user = await prisma.user.create({
            data: {
                clerkId,
                email,
                name: name || null,
                credits: 10, // Initial welcome credits
            },
        });
    }

    return user;
}

/**
 * Checks if a user has enough credits and deducts them.
 */
export async function deductCredits(amount: number) {
    const user = await getOrCreateUser();
    if (!user) throw new Error("Unauthorized");

    if (user.credits < amount) {
        throw new Error("Insufficient credits");
    }

    return await prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: amount } },
    });
}
