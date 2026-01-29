/**
 * CSV Parser for importing machine data
 * Handles validation and cleaning of CSV data
 */

export const parseCSV = (csvText) => {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines
    
    const values = parseCSVLine(lines[i]);
    const record = {};
    
    headers.forEach((header, index) => {
      let value = values[index]?.trim() || null;
      
      // Convert 'null' strings to actual null
      if (value === 'null') value = null;
      
      // Handle year field - convert to integer
      if (header === 'year' && value) {
        const yearInt = parseInt(value, 10);
        record[header] = yearInt === 0 ? null : yearInt;
      } else {
        record[header] = value;
      }
    });
    
    data.push(record);
  }
  
  return data;
};

/**
 * Parse a CSV line respecting quoted fields
 */
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
};

/**
 * Validate machine data before import
 */
export const validateMachineData = (machine) => {
  const errors = [];
  
  // Required fields
  if (!machine.plant_id) errors.push('plant_id is required');
  if (!machine.model) errors.push('model is required');
  if (!machine.manufacturer) errors.push('manufacturer is required');
  
  // Optional fields - validate format
  if (machine.year && (isNaN(machine.year) || machine.year < 1900 || machine.year > new Date().getFullYear())) {
    errors.push(`year must be between 1900 and ${new Date().getFullYear()}`);
  }
  
  if (machine.status && !['operational', 'maintenance', 'broken', 'needs_service', 'Terminated', 'Active'].includes(machine.status)) {
    errors.push(`Invalid status: ${machine.status}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Clean and normalize machine data for database insertion
 */
export const cleanMachineData = (machine) => {
  return {
    plant_id: machine.plant_id || null,
    model: machine.model || null,
    manufacturer: machine.manufacturer || null,
    serial_number: machine.serial_number || null,
    year: machine.year || null,
    attachment: machine.attachment || null,
    status: machine.status || 'operational',
    crew_name: machine.crew_name || null,
  };
};
