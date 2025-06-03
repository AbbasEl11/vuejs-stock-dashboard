const API_URL = "https://sheetdb.io/api/v1/w8reb3oo0bas6";
const companyDataCache = {};

/**
 * Checks if a given key represents a date column.
 * Supports "DD Mon YY", "DD Mon YYYY", and "YYYY-MM-DD" formats.
 * @private
 * @param {string} key - The column header to check.
 * @returns {boolean} True if the key is a date column, false otherwise.
 */
const _isDateColumn = (key) => {
  return (
    /\d{1,2} [A-Za-z]{3} \d{2,4}/.test(key) || /^\d{4}-\d{2}-\d{2}$/.test(key)
  );
};

/**
 * Extracts a numeric value from a string, handling commas, percentages, and parentheses for negatives.
 * @private
 * @param {string|number} value - The value to parse.
 * @returns {number|null} The numeric value, or null if parsing fails.
 */
const _getNumericValue = (value) => {
  if (typeof value === "string") {
    let cleanValue = value.replace(/,/g, "");

    if (cleanValue.endsWith("%")) {
      cleanValue = cleanValue.replace("%", "");
      const parsed = parseFloat(cleanValue);
      return isNaN(parsed) ? null : parsed / 100;
    }

    if (cleanValue.startsWith("(") && cleanValue.endsWith(")")) {
      cleanValue = "-" + cleanValue.substring(1, cleanValue.length - 1);
    }

    const parsed = parseFloat(cleanValue);
    return isNaN(parsed) ? null : parsed;
  }
  if (typeof value === "number") {
    return value;
  }
  return null;
};

/**
 * Parses a date string into a Date object for sorting.
 * Supports "DD Mon YY/YYYY" and "YYYY-MM-DD" formats.
 * @private
 * @param {string} dateStr - The date string to parse.
 * @returns {Date} A Date object.
 */
const _parseDateStringForSorting = (dateStr) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(dateStr);
  const parts = dateStr.match(/(\d{1,2}) ([A-Za-z]{3}) (\d{2,4})/);
  if (parts) {
    const monthNames = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    let year = parseInt(parts[3]);
    if (year < 100) year += 2000;
    return new Date(year, monthNames[parts[2]], parseInt(parts[1]));
  }
  return new Date(0);
};

/**
 * Finds the most probable revenue row within the raw data based on heuristics.
 * Prioritizes rows with large numeric values in the first column and associated date columns.
 * @private
 * @param {Array<object>} data - The raw data from the sheet.
 * @returns {object|null} The identified revenue row, or null if not found.
 */
const _findRevenueRow = (data) => {
  let bestGuessRow = null;
  let maxRevenue = -1;

  for (const row of data) {
    if (row && typeof row === "object") {
      const firstColValue = row[""];
      const numValue = _getNumericValue(firstColValue);
      const hasDateColumns = Object.keys(row).some(_isDateColumn);

      if (numValue !== null && numValue > 100 && hasDateColumns) {
        const releaseColValue = row["Release"];
        const isReleaseColIdentifying =
          typeof releaseColValue === "string" &&
          ["Quarter", "Episode", "Period", "Metric"].includes(
            releaseColValue.trim()
          );

        if (numValue > maxRevenue && !isReleaseColIdentifying) {
          maxRevenue = numValue;
          bestGuessRow = row;
        }
      }
    }
  }
  return bestGuessRow;
};

/**
 * Processes the revenue row to extract card data (revenue, change, percentage change)
 * and determines the display label for the revenue.
 * @private
 * @param {object} revenueRow - The identified revenue row.
 * @param {Array<string>} allDateColumns - Sorted list of all date column headers.
 * @returns {object} An object containing card data.
 */
const _processRevenueCardData = (revenueRow, allDateColumns) => {
  const latestCol = allDateColumns[0];
  const prevCol = allDateColumns[1];

  const latestRevenueVal = _getNumericValue(revenueRow[latestCol]);
  const previousRevenueVal = prevCol
    ? _getNumericValue(revenueRow[prevCol])
    : null;

  let change = "N/A";
  let percentageChange = "N/A";
  let numericPercentageChange = null;
  let revenueLabel = latestCol;

  if (latestRevenueVal !== null && previousRevenueVal !== null) {
    const calculatedChange = latestRevenueVal - previousRevenueVal;
    change = calculatedChange.toLocaleString("de-DE");

    if (previousRevenueVal !== 0) {
      const calculatedPercentageChange = calculatedChange / previousRevenueVal;
      numericPercentageChange = calculatedPercentageChange;
      percentageChange = `${(calculatedPercentageChange * 100)
        .toFixed(2)
        .replace(".", ",")}%`;
    } else if (calculatedChange > 0) {
      percentageChange = "Inf%";
      numericPercentageChange = Infinity;
    } else if (calculatedChange < 0) {
      percentageChange = "-Inf%";
      numericPercentageChange = -Infinity;
    }
  }

  try {
    const date = _parseDateStringForSorting(latestCol);
    if (date.getFullYear() > 1900) {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      revenueLabel = `Q${quarter} ${date.getFullYear()}`;
    }
  } catch (e) {
    console.warn("Could not parse latestCol to quarter label:", latestCol, e);
    revenueLabel = `Latest (${latestCol})`;
  }

  return {
    revenue:
      latestRevenueVal !== null
        ? latestRevenueVal.toLocaleString("de-DE")
        : "N/A",
    change,
    percentageChange,
    numericPercentageChange,
    revenueLabel,
  };
};

/**
 * Extracts historical data series from all relevant rows.
 * @private
 * @param {Array<object>} rawData - The raw data from the sheet.
 * @param {Array<string>} allDateColumns - Sorted list of all date column headers.
 * @returns {object} An object where keys are metric names and values are arrays of {date, value} objects.
 */
const _extractHistoricalData = (rawData, allDateColumns) => {
  const historicalData = {};
  for (const row of rawData) {
    const metricName = (row[""] || row["Release"] || "").trim();
    if (metricName && !["Quarter", "Episode"].includes(metricName)) {
      const series = [];
      for (const dateCol of allDateColumns.slice().reverse()) {
        const value = _getNumericValue(row[dateCol]);
        if (value !== null) {
          series.push({ date: dateCol, value: value });
        }
      }
      if (series.length > 0) {
        historicalData[metricName] = series;
      }
    }
  }
  return historicalData;
};

export const stockService = {
  /**
   * Fetches and processes dashboard data for a given company ticker.
   * Data is cached to avoid redundant API calls.
   * @param {string} companyTicker - The ticker symbol of the company (e.g., "$GOOG").
   * @returns {Promise<object>} A promise that resolves to an object containing cardData, historicalData, and allRows.
   */
  getCompanyDashboardData: async (companyTicker) => {
    const sheetName = companyTicker;

    if (companyDataCache[sheetName]) {
      console.log(`Returning cached data for ${sheetName}`);
      return companyDataCache[sheetName];
    }

    try {
      console.log(`Fetching raw data from: ${API_URL}/?sheet=${sheetName}`);
      const response = await fetch(`${API_URL}/?sheet=${sheetName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const rawData = await response.json();
      console.log(`Raw data for ${sheetName}:`, rawData);

      if (!rawData || rawData.length === 0) {
        console.warn(`No data or empty data for ${companyTicker}.`);
        return (companyDataCache[sheetName] = {
          cardData: {
            revenue: "N/A",
            change: "N/A",
            percentageChange: "N/A",
            revenueLabel: "N/A",
            numericPercentageChange: null,
          },
          historicalData: {},
          allRows: [],
        });
      }

      const firstRowKeys = Object.keys(rawData[0] || {});
      const allDateColumns = firstRowKeys
        .filter(_isDateColumn)
        .sort(
          (a, b) =>
            _parseDateStringForSorting(b) - _parseDateStringForSorting(a)
        );

      const revenueRow = _findRevenueRow(rawData);
      let cardData = {
        revenue: "N/A",
        change: "N/A",
        percentageChange: "N/A",
        revenueLabel: "N/A",
        numericPercentageChange: null,
      };
      let historicalData = {};
      let allRelevantRows = rawData.filter((row) =>
        Object.values(row).some((val) => val !== "" && val !== null)
      );

      if (revenueRow && allDateColumns.length > 0) {
        cardData = _processRevenueCardData(revenueRow, allDateColumns);
        historicalData = _extractHistoricalData(rawData, allDateColumns);
      } else {
        console.warn(
          `Revenue row not found or no date columns for ${sheetName}. Card data will be N/A.`
        );
      }

      const dashboardData = {
        cardData: cardData,
        historicalData: historicalData,
        allRows: allRelevantRows,
      };

      return (companyDataCache[sheetName] = dashboardData);
    } catch (error) {
      console.error(`Error fetching data for sheet '${sheetName}':`, error);
      return (companyDataCache[sheetName] = {
        cardData: {
          revenue: "N/A",
          change: "N/A",
          percentageChange: "N/A",
          revenueLabel: "N/A",
          numericPercentageChange: null,
        },
        historicalData: {},
        allRows: [],
      });
    }
  },
};
