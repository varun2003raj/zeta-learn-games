const trimSlash = (value) => String(value || "").replace(/\/+$/, "");

const extractBackendBaseUrl = (apiClient) => {
  const configuredBase =
    import.meta.env.VITE_API_BASE_URL ||
    apiClient?.defaults?.baseURL ||
    "";
  const normalized = trimSlash(configuredBase);
  return normalized.endsWith("/api")
    ? normalized.slice(0, -4)
    : normalized;
};

const parseDispositionFileName = (contentDisposition) => {
  const value = String(contentDisposition || "");

  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].trim());
  }

  const asciiMatch = value.match(/filename="?([^"]+)"?/i);
  if (asciiMatch?.[1]) {
    return asciiMatch[1].trim();
  }

  return "";
};

const parseUrlFileName = (urlValue) => {
  try {
    const fileName = new URL(urlValue).pathname.split("/").pop();
    return fileName ? decodeURIComponent(fileName) : "";
  } catch {
    const fallback = String(urlValue || "").split("?")[0].split("/").pop();
    return fallback ? decodeURIComponent(fallback) : "";
  }
};

export const resolveBackendFileUrl = (apiClient, fileUrl) => {
  const input = String(fileUrl || "").trim();
  if (!input) return "";
  if (input.startsWith("http://") || input.startsWith("https://")) return input;

  const backendBase = extractBackendBaseUrl(apiClient);
  if (!backendBase) return input;
  if (input.startsWith("/")) return `${backendBase}${input}`;
  return `${backendBase}/${input}`;
};

export const forceDownloadFile = async ({
  apiClient,
  fileUrl,
  fallbackFileName = "download",
}) => {
  const resolvedUrl = resolveBackendFileUrl(apiClient, fileUrl);
  if (!resolvedUrl) {
    throw new Error("No file URL found");
  }

  const response = await apiClient.get(resolvedUrl, { responseType: "blob" });
  const disposition = response?.headers?.["content-disposition"];
  const inferredName =
    parseDispositionFileName(disposition) || parseUrlFileName(resolvedUrl);
  const fileName = inferredName || fallbackFileName;

  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(blobUrl);
};

