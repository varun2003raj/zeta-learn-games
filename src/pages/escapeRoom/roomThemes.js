import desertBackground from "../../assets/escape/desertbackground.png";
import desertPortal from "../../assets/escape/desertportal.png";
import escapeBackground from "../../assets/escape/escapebackground.png";
import hotPortal from "../../assets/escape/hotportal.png";
import jungleBackground from "../../assets/escape/junglebackground.png";
import junglePortal from "../../assets/escape/jungleportal.png";
import mountainBackground from "../../assets/escape/mountainbackground.png";
import mountainPortal from "../../assets/escape/mountainportal.png";
import oceanBackground from "../../assets/escape/oceanbackground.png";
import oceanPortal from "../../assets/escape/oceanportal.png";
import templeBackground from "../../assets/escape/templebackground.png";
import templePortal from "../../assets/escape/templeportal.png";

const ROOM_THEMES = [
  {
    key: "jungle",
    keywords: [
      "jungle",
      "jugle",
      "forest",
      "green",
      "canopy",
      "jungleportal",
      "junglebackground",
    ],
    portal: junglePortal,
    background: jungleBackground,
    accent: "#8fdf55",
    paperText: "#2f2614",
    buttonText: "#eefde6",
  },
  {
    key: "desert",
    keywords: ["desert", "sand", "dune", "desertportal", "desertbackground"],
    portal: desertPortal,
    background: desertBackground,
    accent: "#e9a252",
    paperText: "#3d220e",
    buttonText: "#fff5e6",
  },
  {
    key: "ocean",
    keywords: ["ocean", "water", "sea", "island", "reef", "oceanportal", "oceanbackground"],
    portal: oceanPortal,
    background: oceanBackground,
    accent: "#55b7ee",
    paperText: "#102b41",
    buttonText: "#e8f8ff",
  },
  {
    key: "mountain",
    keywords: [
      "mountain",
      "snow",
      "ice",
      "peak",
      "frost",
      "mountainportal",
      "mountainbackground",
    ],
    portal: mountainPortal,
    background: mountainBackground,
    accent: "#8eb1df",
    paperText: "#1e2c3f",
    buttonText: "#edf4ff",
  },
  {
    key: "temple",
    keywords: ["temple", "ruin", "ancient", "sanctum", "templeportal", "templebackground"],
    portal: templePortal,
    background: templeBackground,
    accent: "#d7b56d",
    paperText: "#32230f",
    buttonText: "#fff7dd",
  },
  {
    key: "hot",
    keywords: ["hot", "fire", "lava", "volcano", "magma", "hotportal"],
    portal: hotPortal,
    background: desertBackground,
    accent: "#ff7f4d",
    paperText: "#3d1a12",
    buttonText: "#fff0eb",
  },
];

const FALLBACK_THEME = {
  key: "default",
  keywords: [],
  portal: junglePortal,
  background: escapeBackground,
  accent: "#7ac3ff",
  paperText: "#262626",
  buttonText: "#f8fafc",
};

const DEFAULT_THEME_CYCLE = ROOM_THEMES.filter((theme) => theme.key !== "hot");

const getRoomHaystack = (room = {}) =>
  `${room?.title || ""} ${room?.description || ""} ${room?.room_key || ""}`.toLowerCase();

const toStableIndex = (room = {}, index = 0, size = ROOM_THEMES.length) => {
  if (size <= 0) return 0;

  const numericId = Number(room?.id ?? room?._id ?? room?.pk);
  if (Number.isFinite(numericId) && numericId !== 0) {
    return (Math.abs(Math.trunc(numericId)) - 1) % size;
  }

  const seedText = `${room?.title || ""}|${room?.description || ""}|${room?.room_key || ""}|${index}`;
  let hash = 0;
  for (let i = 0; i < seedText.length; i += 1) {
    hash = (hash * 31 + seedText.charCodeAt(i)) % 2147483647;
  }
  return hash % size;
};

export const resolveRoomTheme = (room, index = 0) => {
  const haystack = getRoomHaystack(room);
  const matched = ROOM_THEMES.find((theme) =>
    theme.keywords.some((keyword) => haystack.includes(keyword))
  );

  if (matched) return matched;
  if (DEFAULT_THEME_CYCLE.length > 0) {
    return DEFAULT_THEME_CYCLE[toStableIndex(room, index, DEFAULT_THEME_CYCLE.length)];
  }
  if (ROOM_THEMES.length > 0) {
    return ROOM_THEMES[toStableIndex(room, index, ROOM_THEMES.length)];
  }
  return FALLBACK_THEME;
};

export const resolveRoomPortal = (room, index = 0) =>
  resolveRoomTheme(room, index).portal;

export const resolveRoomBackground = (room, index = 0) =>
  resolveRoomTheme(room, index).background;
