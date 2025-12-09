// Terrain Detector Service
// Detects terrain changes using GPS elevation data

export class TerrainDetector {
  /**
   * Calculate grade from elevation change
   * @param {number} elevationChange - Change in meters
   * @param {number} distance - Distance in meters
   * @returns {number} Grade percentage
   */
  static calculateGrade(elevationChange, distance) {
    if (distance === 0) return 0;
    return (elevationChange / distance) * 100;
  }

  /**
   * Classify terrain based on grade
   * @param {number} grade - Grade percentage
   * @returns {string} Terrain type: 'uphill', 'downhill', 'flat'
   */
  static classifyTerrain(grade) {
    if (grade > 3) return 'uphill';
    if (grade < -3) return 'downhill';
    return 'flat';
  }

  /**
   * Calculate cadence adjustment for terrain
   * @param {string} terrainType - Type of terrain
   * @param {number} grade - Grade percentage
   * @param {number} baseCadence - Base cadence in SPM
   * @returns {number} Adjusted cadence
   */
  static adjustCadenceForTerrain(terrainType, grade, baseCadence) {
    let adjustment = 0;
    
    switch (terrainType) {
      case 'uphill':
        // +5 to +8 SPM for uphill
        adjustment = Math.min(8, 5 + Math.abs(grade) * 0.3);
        break;
      case 'downhill':
        // -3 to -5 SPM for downhill
        adjustment = -Math.min(5, 3 + Math.abs(grade) * 0.2);
        break;
      case 'flat':
      default:
        adjustment = 0;
    }
    
    return Math.round(baseCadence + adjustment);
  }

  /**
   * Analyze terrain from GPS data
   * @param {Array} gpsData - Array of GPS points with elevation
   * @returns {Object} Terrain analysis
   */
  static analyzeTerrainProfile(gpsData) {
    if (!gpsData || gpsData.length < 2) {
      return {
        totalElevationGain: 0,
        totalElevationLoss: 0,
        avgGrade: 0,
        terrainDistribution: { flat: 100, uphill: 0, downhill: 0 },
      };
    }

    let elevationGain = 0;
    let elevationLoss = 0;
    const terrainSegments = { flat: 0, uphill: 0, downhill: 0 };

    for (let i = 1; i < gpsData.length; i++) {
      const elevChange = gpsData[i].elevation - gpsData[i - 1].elevation;
      const distance = this.calculateDistance(gpsData[i - 1], gpsData[i]);
      const grade = this.calculateGrade(elevChange, distance);
      const terrain = this.classifyTerrain(grade);

      terrainSegments[terrain] += distance;

      if (elevChange > 0) elevationGain += elevChange;
      if (elevChange < 0) elevationLoss += Math.abs(elevChange);
    }

    const totalDistance = Object.values(terrainSegments).reduce((a, b) => a + b, 0);
    const terrainDistribution = {
      flat: (terrainSegments.flat / totalDistance) * 100,
      uphill: (terrainSegments.uphill / totalDistance) * 100,
      downhill: (terrainSegments.downhill / totalDistance) * 100,
    };

    return {
      totalElevationGain: Math.round(elevationGain),
      totalElevationLoss: Math.round(elevationLoss),
      terrainDistribution,
    };
  }

  /**
   * Calculate distance between two GPS points
   * @param {Object} point1 - First GPS point
   * @param {Object} point2 - Second GPS point
   * @returns {number} Distance in meters
   */
  static calculateDistance(point1, point2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (point1.latitude * Math.PI) / 180;
    const φ2 = (point2.latitude * Math.PI) / 180;
    const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
    const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
