// Utility functions for cadence and pace calculations

/**
 * Convert pace (min/km) to speed (km/h)
 * @param {number} paceMinutes - Pace in minutes per km
 * @returns {number} Speed in km/h
 */
export const paceToSpeed = (paceMinutes) => {
  return 60 / paceMinutes;
};

/**
 * Convert speed (km/h) to pace (min/km)
 * @param {number} speedKmh - Speed in km/h
 * @returns {number} Pace in minutes per km
 */
export const speedToPace = (speedKmh) => {
  return 60 / speedKmh;
};

/**
 * Format pace as MM:SS
 * @param {number} paceMinutes - Pace in decimal minutes
 * @returns {string} Formatted pace
 */
export const formatPace = (paceMinutes) => {
  const minutes = Math.floor(paceMinutes);
  const seconds = Math.round((paceMinutes - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Calculate stride length from cadence and speed
 * @param {number} cadence - Cadence in steps per minute
 * @param {number} speedKmh - Speed in km/h
 * @returns {number} Stride length in meters
 */
export const calculateStrideLength = (cadence, speedKmh) => {
  const speedMps = (speedKmh * 1000) / 3600; // Convert to m/s
  const stepsPerSecond = cadence / 60;
  return speedMps / stepsPerSecond;
};

/**
 * Calculate optimal cadence for a given pace
 * @param {number} targetPaceMinKm - Target pace in min/km
 * @param {number} height - Runner height in cm
 * @param {string} experience - Experience level
 * @returns {number} Optimal cadence in SPM
 */
export const calculateOptimalCadence = (targetPaceMinKm, height, experience) => {
  // Base cadence
  let cadence = 170;

  // Adjust for pace (faster = higher cadence)
  if (targetPaceMinKm < 4) cadence += 8;
  else if (targetPaceMinKm < 5) cadence += 5;
  else if (targetPaceMinKm < 6) cadence += 2;
  else if (targetPaceMinKm > 7) cadence -= 3;

  // Adjust for height
  if (height < 160) cadence += 3;
  else if (height < 170) cadence += 1;
  else if (height > 190) cadence -= 3;
  else if (height > 180) cadence -= 1;

  // Adjust for experience
  const experienceAdjustments = {
    beginner: -5,
    intermediate: 0,
    advanced: 3,
    elite: 5,
  };
  cadence += experienceAdjustments[experience] || 0;

  return Math.round(cadence);
};

/**
 * Calculate race finish time
 * @param {number} distance - Distance in km
 * @param {number} paceMinKm - Pace in min/km
 * @returns {string} Formatted finish time HH:MM:SS
 */
export const calculateFinishTime = (distance, paceMinKm) => {
  const totalMinutes = distance * paceMinKm;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  const seconds = Math.round((totalMinutes % 1) * 60);

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Parse time string to minutes
 * @param {string} timeString - Time in HH:MM:SS format
 * @returns {number} Total minutes
 */
export const parseTimeToMinutes = (timeString) => {
  const parts = timeString.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 60 + parts[1] + parts[2] / 60;
  } else if (parts.length === 2) {
    return parts[0] + parts[1] / 60;
  }
  return 0;
};
