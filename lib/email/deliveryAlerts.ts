import { prisma } from "@/lib/prisma";

export type EmailDeliveryAlertSummary = {
  failedEnrollments: number;
  latestError: string | null;
  latestFailedAt: string | null;
};

export async function getEmailDeliveryAlertSummary(
  userId: string
): Promise<EmailDeliveryAlertSummary> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [failedEnrollments, latestFailedEnrollment] = await Promise.all([
    prisma.emailFlowEnrollment.count({
      where: {
        userId,
        status: "failed",
        updatedAt: { gte: since },
      },
    }),
    prisma.emailFlowEnrollment.findFirst({
      where: {
        userId,
        status: "failed",
      },
      orderBy: { updatedAt: "desc" },
      select: {
        updatedAt: true,
        errors: true,
      },
    }),
  ]);

  const errors = Array.isArray(latestFailedEnrollment?.errors)
    ? latestFailedEnrollment.errors
    : [];
  const latestError =
    typeof errors[errors.length - 1] === "string"
      ? (errors[errors.length - 1] as string)
      : null;

  return {
    failedEnrollments,
    latestError,
    latestFailedAt: latestFailedEnrollment?.updatedAt.toISOString() ?? null,
  };
}
