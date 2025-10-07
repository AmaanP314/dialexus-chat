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
import {
  isToday,
  isYesterday,
  format as formatDate,
  isSameDay,
} from "date-fns";

const IST_TIMEZONE = "Asia/Kolkata";

/**
 * Formats a timestamp for the message bubble (e.g., "8:39 AM").
 * @param utcTimestamp The UTC timestamp string from the server.
 */
export const formatMessageTimestamp = (utcTimestamp: string): string => {
  try {
    // 1. Ensure the timestamp is explicitly marked as UTC (Zulu time)
    let utcString = utcTimestamp.endsWith("Z")
      ? utcTimestamp
      : `${utcTimestamp}Z`;

    // 2. Create the Date object, which now correctly represents the UTC moment in time
    const date = new Date(utcString);

    // 3. formatInTimeZone converts the correct UTC moment to IST
    const istTime = formatInTimeZone(date, IST_TIMEZONE, "h:mm a");

    // console.log("Input string (fixed):", utcString);
    // console.log("IST timestamp (fixed):", istTime);

    return istTime;
  } catch (error) {
    return "Invalid date";
  }
};

/**
 * Formats a timestamp for the conversation list (e.g., "8:39 AM", "Yesterday", "03/10/2025").
 * @param utcTimestamp The UTC timestamp string from the server.
 */
export const formatConversationTimestamp = (utcTimestamp: string): string => {
  try {
    // FIX: Explicitly mark the input string as UTC (by appending 'Z')
    // to ensure 'new Date()' correctly interprets the time regardless of the server's locale.
    const utcString = utcTimestamp.endsWith("Z")
      ? utcTimestamp
      : `${utcTimestamp}Z`;

    // Create the Date object from the correct UTC moment.
    const date = new Date(utcString);

    // NOTE: isToday and isYesterday should be timezone-aware functions
    // that internally compare the 'date' (which is a UTC moment)
    // against the current *IST* date/time.

    if (isToday(date)) {
      // If it's today, format it to the time in IST.
      return formatInTimeZone(date, IST_TIMEZONE, "h:mm a");
    }

    if (isYesterday(date)) {
      // If it's yesterday in IST.
      return "Yesterday";
    }

    // Otherwise, format it as a date.
    // NOTE: You might need to use a timezone-aware function here too,
    // e.g., formatInTimeZone(date, IST_TIMEZONE, "dd/MM/yyyy")
    // to ensure the date (dd/MM/yyyy) is also calculated based on IST.
    return formatDate(date, "dd/MM/yyyy");
  } catch (error) {
    // console.error("Error formatting conversation timestamp:", error);
    return "Invalid date";
  }
};

/**
 * Formats the "last seen" status with full clarity (e.g., "last seen today at 8:29 AM").
 * @param utcTimestamp The UTC timestamp string from the server.
 */
export const formatLastSeen = (utcTimestamp: string): string => {
  try {
    const date = new Date(utcTimestamp);
    const timePart = formatInTimeZone(date, IST_TIMEZONE, "h:mm a");

    if (isToday(date)) {
      return `last seen today at ${timePart}`;
    }
    if (isYesterday(date)) {
      return `last seen yesterday at ${timePart}`;
    }
    // const datePart = formatDate(date, "on dd/MM/yyyy");
    const datePart = formatDate(date, "'on' dd/MM/yyyy");
    return `last seen ${datePart}`;
  } catch (error) {
    console.error(
      "Error formatting last seen:",
      error,
      "with input:",
      utcTimestamp
    );
    return "Invalid date";
  }
};

/**
 * Formats a date for the chat header (e.g., "Today", "Yesterday", "October 3, 2025").
 * @param dateInput The date to format.
 */
export const formatDateHeader = (dateInput: string | Date): string => {
  const date = new Date(dateInput);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return formatDate(date, "MMMM d, yyyy");
};

/**
 * Helper to check if two dates are on the same day.
 * @param date1 The first date string.
 * @param date2 The second date string.
 */
export const areDatesOnSameDay = (date1?: string, date2?: string): boolean => {
  if (!date1 || !date2) return false;
  return isSameDay(new Date(date1), new Date(date2));
};
