export const difficultyOptions = ["Easy", "Medium", "Hard", "Extreme"];

export const statusBadgeClass = (value) =>
  value
    ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/40"
    : "bg-amber-500/20 text-amber-200 border-amber-500/40";

export const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export const getListFromPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.results)) return payload.results;
  return [];
};

export const hashTextSha256 = async (text) => {
  const encoded = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  const bytes = [...new Uint8Array(digest)];
  return bytes.map((value) => value.toString(16).padStart(2, "0")).join("");
};

export const truncate = (value, length = 64) => {
  const text = String(value || "");
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...`;
};
