/** MongoDB server error code for a violated unique index. */
export const MONGO_DUPLICATE_KEY = 11000;

export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: number }).code === MONGO_DUPLICATE_KEY
  );
}
