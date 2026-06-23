/**
 * Formats an ISO date string by:
 * - Replacing "T" with a space
 * - Removing trailing "Z"
 *
 * @param {string} dateString
 * @returns {string} formatted date string
 */
export const formatISODateString = (dateString) => {
  if (!dateString) return "";

  return dateString.replace("T", " ").replace("Z", "");
};
