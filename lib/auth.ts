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
 * Atomically checks credit balance and deducts if sufficient.
 * Uses a conditional UPDATE (WHERE credits >= amount) to eliminate
 * the check-then-act race condition under concurrent requests.
 */
export async function deductCredits(amount: number) {
    const user = await getOrCreateUser();
    if (!user) throw new Error("Unauthorized");

    // Atomic: only updates the row if credits are still sufficient.
    // If two concurrent requests both read "100 credits" and both try to
    // deduct 100, only one will match the WHERE clause and succeed.
    const result = await prisma.user.updateMany({
        where: { id: user.id, credits: { gte: amount } },
        data: { credits: { decrement: amount } },
    });

    if (result.count === 0) {
        throw new Error("Insufficient credits");
    }

    return prisma.user.findUniqueOrThrow({ where: { id: user.id } });
}
