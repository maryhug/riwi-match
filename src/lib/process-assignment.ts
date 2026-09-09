import type { User } from "@/lib/types/api";

type ProcessOwnerCandidate = Pick<User, "id" | "role" | "status">;
type CurrentUser = Pick<User, "id" | "role">;

export function isAssignableProcessOwner(
  candidate: ProcessOwnerCandidate,
  currentUser: CurrentUser | null,
): boolean {
  if (candidate.status !== "ACTIVE") return false;
  if (candidate.role === "RECRUITER") return true;
  return (
    currentUser?.role === "TA_LEADER" &&
    candidate.role === "TA_LEADER" &&
    candidate.id === currentUser.id
  );
}
