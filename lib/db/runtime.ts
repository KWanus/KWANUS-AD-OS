export function isDatabaseUnavailable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const maybeError = error as {
    code?: string;
    message?: string;
    meta?: {
      driverAdapterError?: {
        message?: string;
        cause?: { message?: string };
      };
    };
  };

  const driverMessage =
    maybeError.meta?.driverAdapterError?.message ??
    maybeError.meta?.driverAdapterError?.cause?.message ??
    "";

  return (
    maybeError.code === "P1001" ||
    maybeError.code === "P2021" ||
    maybeError.message?.includes("Can't reach database server") === true ||
    maybeError.message?.includes("does not exist in the current database") === true ||
    driverMessage.includes("DatabaseNotReachable") === true ||
    driverMessage.includes("TableDoesNotExist") === true
  );
}
