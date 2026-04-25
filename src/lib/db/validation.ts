import { getUserLists, getUserProjects } from "./index";

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export async function isListNameTaken(
  userId: string,
  name: string,
  excludeListId?: string
): Promise<boolean> {
  const target = normalize(name);
  const lists = await getUserLists(userId);
  return lists.some((l) => l.id !== excludeListId && normalize(l.name) === target);
}

export async function isProjectNameTaken(
  userId: string,
  name: string,
  excludeProjectId?: string
): Promise<boolean> {
  const target = normalize(name);
  const projects = await getUserProjects(userId);
  return projects.some(
    (p) => p.id !== excludeProjectId && normalize(p.name) === target
  );
}
