export const ctfLinks = [
  { to: "/games/ctf/categories", label: "CTF Categories" },
  { to: "/games/ctf/challenges", label: "CTF Challenges" },
  { to: "/games/ctf/hints", label: "CTF Hints" },
  { to: "/games/ctf/announcements", label: "Announcements" },
  { to: "/games/ctf/teams", label: "Teams" },
  { to: "/games/ctf/leaderboard", label: "Leaderboard" },
];

export const escapeLinks = [
  { to: "/games/escape-rooms", label: "Escape Room" },
  { to: "/games/attempts", label: "Attempts" },
];

export const sidebarLinks = [
  { to: "/games/dashboard", label: "Games Home" },
  ...ctfLinks,
  ...escapeLinks,
];

export function isGamesHomePath(pathname) {
  return pathname === "/games" || pathname === "/games/dashboard";
}

export function isSectionItemActive(pathname, targetPath) {
  if (pathname === targetPath || pathname.startsWith(`${targetPath}/`)) {
    return true;
  }

  if (
    targetPath === "/games/escape-rooms" &&
    (pathname.startsWith("/games/levels/") || pathname.startsWith("/games/questions/"))
  ) {
    return true;
  }

  return false;
}

export function getSectionLinks(pathname) {
  if (pathname.startsWith("/games/ctf/")) {
    return ctfLinks;
  }

  if (
    pathname.startsWith("/games/escape-rooms") ||
    pathname.startsWith("/games/levels/") ||
    pathname.startsWith("/games/questions/") ||
    pathname.startsWith("/games/attempts")
  ) {
    return escapeLinks;
  }

  return [];
}
