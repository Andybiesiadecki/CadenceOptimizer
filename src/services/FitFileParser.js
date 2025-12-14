// FIT File Parser Service
// Handles parsing of fitness files from multiple platforms (Garmin, Wahoo, Apple, Android)

import FitParser from 'fit-file-parser';

export class FitFileParser {
  /**
   * Parse FIT file and extract running data
   * @param {string} base64Data - Base64 encoded FIT file
   * @returns {Object} Parsed running data
   */
  static async parseFitFile(base64Data) {
    try {
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Initialize FIT parser
      const fitParser = new FitParser({
        force: true,
        speedUnit: 'km/h',
        lengthUnit: 'm',
        temperatureUnit: 'celsius',
        elapsedRecordField: true,
        mode: 'list',
      });

      // Parse the FIT file
      const parsedData = fitParser.parse(buffer);

      return {
        records: parsedData.records || [],
        sessions: parsedData.sessions || [],
        laps: parsedData.laps || [],
        activities: parsedData.activities || [],
        deviceInfo: parsedData.device_infos || [],
        fileId: parsedData.file_ids || [],
      };
    } catch (error) {
      console.error('Error parsing FIT file:', error);
      throw new Error(`Failed to parse FIT file: ${error.message}`);
    }
  }

  /**
   * Extract cadence data from parsed FIT file
   * @param {Object} parsedData - Parsed FIT data
   * @returns {Array} Cadence data points with timestamps
   */
  static extractCadenceData(parsedData) {
    const cadenceData = [];
    
    if (parsedData.records) {
      parsedData.records.forEach(record => {
        if (record.cadence !== undefined && record.cadence !== null) {
          cadenceData.push({
            timestamp: record.timestamp,
            cadence: record.cadence,
            // Some devices store cadence as steps per minute, others as RPM
            // Convert to steps per minute (SPM) if needed
            spm: this.convertToStepsPerMinute(record.cadence, record),
          });
        }
      });
    }

    return cadenceData;
  }

  /**
   * Convert cadence to steps per minute (handles different device formats)
   * @param {number} cadence - Raw cadence value
   * @param {Object} record - Full record for context
   * @returns {number} Cadence in steps per minute
   */
  static convertToStepsPerMinute(cadence, record) {
    // Most running devices store cadence as steps per minute
    // But some cycling computers might store as RPM, so we need to detect
    if (record.sport === 'cycling' || cadence < 100) {
      // Likely RPM, convert to SPM by doubling
      return cadence * 2;
    }
    return cadence;
  }

  /**
   * Extract speed/pace data
   * @param {Object} parsedData - Parsed FIT data
   * @returns {Array} Speed data points
   */
  static extractSpeedData(parsedData) {
    const speedData = [];
    
    if (parsedData.records) {
      parsedData.records.forEach(record => {
        if (record.speed !== undefined && record.speed !== null) {
          speedData.push({
            timestamp: record.timestamp,
            speed: record.speed, // m/s
            speedKmh: record.speed * 3.6, // km/h
            pace: record.speed > 0 ? (1000 / (record.speed * 60)) : 0, // min/km
          });
        }
      });
    }

    return speedData;
  }

  /**
   * Extract heart rate data
   * @param {Object} parsedData - Parsed FIT data
   * @returns {Array} Heart rate data points
   */
  static extractHeartRateData(parsedData) {
    const heartRateData = [];
    
    if (parsedData.records) {
      parsedData.records.forEach(record => {
        if (record.heart_rate !== undefined && record.heart_rate !== null) {
          heartRateData.push({
            timestamp: record.timestamp,
            heartRate: record.heart_rate,
          });
        }
      });
    }

    return heartRateData;
  }

  /**
   * Extract GPS coordinates and elevation
   * @param {Object} parsedData - Parsed FIT data
   * @returns {Array} GPS coordinates with elevation
   */
  static extractGPSData(parsedData) {
    const gpsData = [];
    
    if (parsedData.records) {
      parsedData.records.forEach(record => {
        if (record.position_lat !== undefined && record.position_long !== undefined) {
          gpsData.push({
            timestamp: record.timestamp,
            latitude: this.convertSemicirclesToDegrees(record.position_lat),
            longitude: this.convertSemicirclesToDegrees(record.position_long),
            elevation: record.altitude || record.enhanced_altitude || 0,
            distance: record.distance || 0,
          });
        }
      });
    }

    return gpsData;
  }

  /**
   * Convert semicircles to degrees (FIT file GPS format)
   * @param {number} semicircles - GPS coordinate in semicircles
   * @returns {number} Coordinate in degrees
   */
  static convertSemicirclesToDegrees(semicircles) {
    return semicircles * (180 / Math.pow(2, 31));
  }

  /**
   * Get comprehensive run summary from parsed data
   * @param {Object} parsedData - Parsed FIT data
   * @returns {Object} Run summary statistics
   */
  static getRunSummary(parsedData) {
    const cadenceData = this.extractCadenceData(parsedData);
    const speedData = this.extractSpeedData(parsedData);
    const heartRateData = this.extractHeartRateData(parsedData);
    const gpsData = this.extractGPSData(parsedData);

    // Get session data for overall stats
    const session = parsedData.sessions?.[0] || {};

    return {
      // Basic run info
      totalDistance: session.total_distance || 0, // meters
      totalTime: session.total_elapsed_time || 0, // seconds
      avgSpeed: session.avg_speed || 0, // m/s
      maxSpeed: session.max_speed || 0, // m/s
      
      // Cadence statistics
      avgCadence: this.calculateAverage(cadenceData.map(d => d.spm)),
      minCadence: Math.min(...cadenceData.map(d => d.spm)),
      maxCadence: Math.max(...cadenceData.map(d => d.spm)),
      cadenceVariability: this.calculateStandardDeviation(cadenceData.map(d => d.spm)),
      
      // Heart rate statistics
      avgHeartRate: session.avg_heart_rate || this.calculateAverage(heartRateData.map(d => d.heartRate)),
      maxHeartRate: session.max_heart_rate || Math.max(...heartRateData.map(d => d.heartRate)),
      
      // Elevation data
      totalAscent: session.total_ascent || 0,
      totalDescent: session.total_descent || 0,
      
      // Device info
      deviceInfo: this.getDeviceInfo(parsedData),
      
      // Data quality
      dataPoints: {
        cadence: cadenceData.length,
        speed: speedData.length,
        heartRate: heartRateData.length,
        gps: gpsData.length,
      },
    };
  }

  /**
   * Get device information from FIT file
   * @param {Object} parsedData - Parsed FIT data
   * @returns {Object} Device information
   */
  static getDeviceInfo(parsedData) {
    const deviceInfo = parsedData.deviceInfo?.[0] || {};
    const fileId = parsedData.fileId?.[0] || {};

    return {
      manufacturer: this.getManufacturerName(deviceInfo.manufacturer),
      product: deviceInfo.product,
      serialNumber: deviceInfo.serial_number,
      softwareVersion: deviceInfo.software_version,
      fileType: fileId.type,
      timeCreated: fileId.time_created,
    };
  }

  /**
   * Convert manufacturer ID to readable name
   * @param {number} manufacturerId - Manufacturer ID from FIT file
   * @returns {string} Manufacturer name
   */
  static getManufacturerName(manufacturerId) {
    const manufacturers = {
      1: 'Garmin',
      15: 'Wahoo',
      89: 'Suunto',
      263: 'Polar',
      1328: 'Coros',
      // Add more as needed
    };
    return manufacturers[manufacturerId] || `Unknown (${manufacturerId})`;
  }

  /**
   * Calculate average of an array of numbers
   * @param {Array} values - Array of numbers
   * @returns {number} Average value
   */
  static calculateAverage(values) {
    if (!values || values.length === 0) return 0;
    const validValues = values.filter(v => !isNaN(v) && v > 0);
    return validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0;
  }

  /**
   * Calculate standard deviation
   * @param {Array} values - Array of numbers
   * @returns {number} Standard deviation
   */
  static calculateStandardDeviation(values) {
    if (!values || values.length === 0) return 0;
    const validValues = values.filter(v => !isNaN(v) && v > 0);
    if (validValues.length === 0) return 0;
    
    const avg = this.calculateAverage(validValues);
    const squareDiffs = validValues.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = this.calculateAverage(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Analyze cadence zones (optimal vs sub-optimal)
   * @param {Array} cadenceData - Cadence data points
   * @returns {Object} Cadence zone analysis
   */
  static analyzeCadenceZones(cadenceData) {
    if (!cadenceData || cadenceData.length === 0) {
      return { optimal: 0, subOptimal: 0, zones: {} };
    }

    const zones = {
      veryLow: 0,    // < 160 SPM
      low: 0,        // 160-169 SPM
      optimal: 0,    // 170-180 SPM
      high: 0,       // 181-190 SPM
      veryHigh: 0,   // > 190 SPM
    };

    cadenceData.forEach(data => {
      const spm = data.spm;
      if (spm < 160) zones.veryLow++;
      else if (spm < 170) zones.low++;
      else if (spm <= 180) zones.optimal++;
      else if (spm <= 190) zones.high++;
      else zones.veryHigh++;
    });

    const total = cadenceData.length;
    const optimalPercentage = (zones.optimal / total) * 100;
    const subOptimalPercentage = 100 - optimalPercentage;

    return {
      optimal: Math.round(optimalPercentage),
      subOptimal: Math.round(subOptimalPercentage),
      zones: {
        veryLow: Math.round((zones.veryLow / total) * 100),
        low: Math.round((zones.low / total) * 100),
        optimal: Math.round((zones.optimal / total) * 100),
        high: Math.round((zones.high / total) * 100),
        veryHigh: Math.round((zones.veryHigh / total) * 100),
      },
    };
  }
}
