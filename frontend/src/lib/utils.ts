/**
 * Creates a downloadable URL for a Cloudinary resource.
 * For non-image files, it changes the resource type to 'raw' and adds the 'fl_attachment' flag.
 * @param {string} url - The original Cloudinary URL.
 * @returns {string} The transformed URL ready for download.
 */
const getCloudinaryDownloadUrl = (url: string): string => {
  // Check if the URL is for a non-image file that needs transformation
  // A simple check is to see if it's not a common image extension.
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);

  if (isImage) {
    // For images, we can still add fl_attachment to encourage download
    return url.replace("/upload/", "/upload/fl_attachment/");
  } else {
    // For other files (PDF, DOCX, etc.), change resource_type and add the flag
    return url.replace("/image/upload/", "/raw/upload/fl_attachment/");
  }
};

/**
 * Forces a browser to download a file from a given URL, even if it's cross-origin.
 * @param {string} url - The URL of the file to download.
 * @param {string} fileName - The desired name for the downloaded file.
 */
export const forceDownload = async (url: string, fileName: string) => {
  try {
    // *** Use the new helper to get the correct URL first ***
    const downloadUrl = getCloudinaryDownloadUrl(url);

    const response = await fetch(downloadUrl);
    if (!response.ok)
      throw new Error(`Network response was not ok: ${response.statusText}`);
    const blob = await response.blob();

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error("Download failed:", error);
    // Fallback: open the raw URL in a new tab
    window.open(url, "_blank");
  }
};

import { formatInTimeZone } from "date-fns-tz";

/**
 * Formats a UTC timestamp string into a user-friendly IST string.
 * @param {string} utcTimestamp - The ISO timestamp string from the API (in UTC).
 * @returns {string} The formatted date string (e.g., "Aug 16, 2025 12:49").
 */
export const formatTimestampIST = (utcTimestamp: string): string => {
  try {
    const date = new Date(utcTimestamp);
    const timeZone = "Asia/Kolkata";
    // Example format: Aug 16, 2025 12:49
    return formatInTimeZone(date, timeZone, "MMM d, yyyy HH:mm");
  } catch (error) {
    console.error("Failed to format timestamp:", error);
    return "Invalid date";
  }
};
