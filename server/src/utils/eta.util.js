/**
 * ETA Utilities
 * 
 * Helper functions to calculate estimated time of arrival, 
 * adjust for traffic/delays, and format time outputs.
 */

export const etaUtils = {
  /**
   * Calculates estimated arrival time based on duration
   * @param {number} durationSeconds 
   * @returns {Date}
   */
  calculateArrivalTime(durationSeconds) {
    const now = new Date();
    return new Date(now.getTime() + durationSeconds * 1000);
  },

  /**
   * Formats duration into human readable string
   * @param {number} durationSeconds 
   * @returns {string}
   */
  formatTravelTime(durationSeconds) {
    const minutes = Math.ceil(durationSeconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours} hr ${remainingMins} min`;
  }
};
