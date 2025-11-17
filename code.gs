// Complete Google Apps Script Backend for Ethiopian Electric Utility
// Updated for your specific Google Sheet structure
// Spreadsheet ID: 1wHZT8vXoAjQwRUHGNKbvKaYW_Eo0517tvUh-zg8RxVM

const CONFIG = {
  SHEET_ID: '1wHZT8vXoAjQwRUHGNKbvKaYW_Eo0517tvUh-zg8RxVM',
  DRIVE_FOLDER_ID: PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID') || '1AMbkns9nonfAnEMYRxkyqhbmA2YBXfIM',
  JWT_SECRET: PropertiesService.getScriptProperties().getProperty('JWT_SECRET') || 'eeu-complaint-jwt-secret-2025-enhanced',
  API_KEY: PropertiesService.getScriptProperties().getProperty('API_KEY') || 'eeu-complaint-api-key-2025',
  VERSION: '3.3.0',
  MAX_LOGIN_ATTEMPTS: 5,
  SESSION_DURATION: 24 * 60 * 60 * 1000,
  PAGINATION_LIMIT: 1000,
  RATE_LIMIT_WINDOW_MS: 60000,
  RATE_LIMIT_MAX_REQUESTS: 100,
  CACHE_DURATION_MS: 5 * 60 * 1000, // 5 minutes cache
  BACKUP_RETENTION_DAYS: 30,
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key, x-client-version',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json',
  'X-API-Version': CONFIG.VERSION
};

// App roles enum
const APP_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager', 
  STAFF: 'staff',
  CUSTOMER: 'customer'
};

// Rate limiting storage
const rateLimitStore = {};

// Cache storage
const cacheStore = {};

// ========== ENHANCED UTILITY FUNCTIONS ==========

/**
 * Input validation functions
 */
function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  // Ethiopian phone number validation (basic)
  const phoneRegex = /^(\+251|0)?[9|7][0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
}

function validateRequired(value, fieldName) {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw new Error(`${fieldName} is required`);
  }
  return value.trim();
}

function validateLength(value, fieldName, min = 0, max = 255) {
  if (value.length < min) {
    throw new Error(`${fieldName} must be at least ${min} characters`);
  }
  if (value.length > max) {
    throw new Error(`${fieldName} must not exceed ${max} characters`);
  }
  return value;
}

function validateEnum(value, fieldName, allowedValues) {
  if (!allowedValues.includes(value)) {
    throw new Error(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }
  return value;
}

function sanitizeInput(input) {
  if (typeof input === 'string') {
    // Remove potentially dangerous characters and trim
    return input.replace(/[<>\"'&]/g, '').trim();
  }
  return input;
}

/**
 * Caching functions
 */
function getCache(key) {
  const cached = cacheStore[key];
  if (cached && (Date.now() - cached.timestamp) < CONFIG.CACHE_DURATION_MS) {
    return cached.data;
  }
  return null;
}

function setCache(key, data) {
  cacheStore[key] = {
    data: data,
    timestamp: Date.now()
  };
}

function clearCache(key) {
  delete cacheStore[key];
}

function clearAllCache() {
  Object.keys(cacheStore).forEach(key => delete cacheStore[key]);
}

/**
 * Data integrity validation
 */
function validateUserRoleIntegrity() {
  try {
    const profiles = getSheetData('Profiles');
    const roles = getSheetData('Roles');

    const roleIds = new Set(roles.map(r => r.ID));
    const profilesWithInvalidRoles = profiles.filter(p => p['Role ID'] && !roleIds.has(p['Role ID']));

    // Check for profiles without roles
    const profilesWithoutRoles = profiles.filter(p => !p['Role ID'] || p['Role ID'] === '');

    return {
      profilesWithInvalidRoles: profilesWithInvalidRoles.length,
      profilesWithoutRoles: profilesWithoutRoles.length,
      totalProfiles: profiles.length,
      totalRoles: roles.length
    };
  } catch (error) {
    console.error('Error validating user role integrity:', error);
    return { error: error.message };
  }
}

function validateComplaintIntegrity() {
  try {
    const complaints = getSheetData('Complaints');
    const profiles = getSheetData('Profiles');

    const profileIds = new Set(profiles.map(p => p.ID));
    const invalidComplaints = complaints.filter(c =>
      c['Assigned To'] && !profileIds.has(c['Assigned To'])
    );

    return {
      invalidComplaints: invalidComplaints.length,
      totalComplaints: complaints.length
    };
  } catch (error) {
    console.error('Error validating complaint integrity:', error);
    return { error: error.message };
  }
}

function validateRolePermissionIntegrity() {
  try {
    const roles = getSheetData('Roles');
    const permissions = getSheetData('Role_Permissions');

    const roleIds = new Set(roles.map(r => r.ID));
    const permissionRoleIds = new Set(permissions.map(p => p['Role ID']));

    // Check for orphaned permissions (permissions without corresponding roles)
    const orphanedPermissions = permissions.filter(p => !roleIds.has(p['Role ID']));

    // Check for roles without permissions
    const rolesWithoutPermissions = roles.filter(r => !permissionRoleIds.has(r.ID));

    return {
      orphanedPermissions: orphanedPermissions.length,
      rolesWithoutPermissions: rolesWithoutPermissions.length,
      totalRoles: roles.length,
      totalPermissions: permissions.length
    };
  } catch (error) {
    console.error('Error validating role permission integrity:', error);
    return { error: error.message };
  }
}

/**
 * Enhanced logging system
 */
function logActivity(action, userId, userEmail, details, ipAddress = '', userAgent = '') {
  try {
    const logEntry = {
      'Timestamp': getCurrentTimestamp(),
      'Action': action,
      'User ID': userId || '',
      'User Email': userEmail || '',
      'Details': JSON.stringify(details),
      'IP Address': ipAddress,
      'User Agent': userAgent.substring(0, 500) // Limit user agent length
    };

    insertRecord('System_Logs', logEntry);
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

function getActivityLogs(filters = {}, limit = 100) {
  try {
    return getSheetData('System_Logs', filters)
      .sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp))
      .slice(0, limit);
  } catch (error) {
    console.error('Error retrieving activity logs:', error);
    return [];
  }
}

/**
 * Backup functionality
 */
function createBackup(backupType = 'manual') {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFolderName = `EEU_Backups_${timestamp}`;

    // Create backup folder
    const rootFolder = DriveApp.getRootFolder();
    const backupFolder = rootFolder.createFolder(backupFolderName);

    // Copy spreadsheet
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const backupFile = DriveApp.getFileById(CONFIG.SHEET_ID).makeCopy(backupFolder);
    backupFile.setName(`EEU_Data_Backup_${timestamp}`);

    // Create backup metadata
    const metadata = {
      backupType: backupType,
      timestamp: getCurrentTimestamp(),
      originalSheetId: CONFIG.SHEET_ID,
      backupFileId: backupFile.getId(),
      sheetNames: ss.getSheets().map(s => s.getName()),
      totalSheets: ss.getSheets().length,
      dataIntegrity: {
        userRoles: validateUserRoleIntegrity(),
        complaints: validateComplaintIntegrity()
      }
    };

    // Save metadata to backup folder
    const metadataFile = backupFolder.createFile(
      'backup_metadata.json',
      JSON.stringify(metadata, null, 2),
      'application/json'
    );

    // Clean up old backups
    cleanupOldBackups();

    logActivity('BACKUP_CREATED', 'system', 'system', {
      backupType,
      backupFolderId: backupFolder.getId(),
      backupFileId: backupFile.getId()
    });

    return {
      success: true,
      backupFolderId: backupFolder.getId(),
      backupFileId: backupFile.getId(),
      metadataFileId: metadataFile.getId(),
      message: 'Backup created successfully'
    };

  } catch (error) {
    console.error('Error creating backup:', error);
    logActivity('BACKUP_FAILED', 'system', 'system', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
}

function cleanupOldBackups() {
  try {
    const rootFolder = DriveApp.getRootFolder();
    const folders = rootFolder.getFoldersByName('EEU_Backups_');

    while (folders.hasNext()) {
      const folder = folders.next();
      const folderName = folder.getName();

      // Extract timestamp from folder name
      const timestampMatch = folderName.match(/EEU_Backups_(.+)/);
      if (timestampMatch) {
        const backupDate = new Date(timestampMatch[1].replace(/-/g, ':'));
        const daysDiff = (Date.now() - backupDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysDiff > CONFIG.BACKUP_RETENTION_DAYS) {
          folder.setTrashed(true);
          console.log(`Deleted old backup: ${folderName}`);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
  }
}

function listBackups() {
  try {
    const rootFolder = DriveApp.getRootFolder();
    const folders = rootFolder.getFoldersByName('EEU_Backups_');
    const backups = [];

    while (folders.hasNext()) {
      const folder = folders.next();
      const files = folder.getFiles();

      let backupFile = null;
      let metadataFile = null;

      while (files.hasNext()) {
        const file = files.next();
        if (file.getName().includes('Backup')) {
          backupFile = file;
        } else if (file.getName() === 'backup_metadata.json') {
          metadataFile = file;
        }
      }

      backups.push({
        folderId: folder.getId(),
        folderName: folder.getName(),
        backupFileId: backupFile ? backupFile.getId() : null,
        metadataFileId: metadataFile ? metadataFile.getId() : null,
        createdAt: folder.getDateCreated().toISOString()
      });
    }

    return {
      success: true,
      backups: backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    };

  } catch (error) {
    console.error('Error listing backups:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * System health check function
 */
function runSystemHealthCheck() {
  try {
    const results = {
      timestamp: getCurrentTimestamp(),
      version: CONFIG.VERSION,
      checks: {}
    };

    // Sheet connectivity check
    try {
      const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
      results.checks.sheetConnectivity = {
        status: 'healthy',
        sheetCount: ss.getSheets().length,
        sheetNames: ss.getSheets().map(s => s.getName())
      };
    } catch (error) {
      results.checks.sheetConnectivity = {
        status: 'unhealthy',
        error: error.message
      };
    }

    // Drive connectivity check
    try {
      const folder = getOrCreateDriveFolder();
      results.checks.driveConnectivity = {
        status: 'healthy',
        folderId: folder.getId(),
        folderName: folder.getName()
      };
    } catch (error) {
      results.checks.driveConnectivity = {
        status: 'unhealthy',
        error: error.message
      };
    }

    // Data integrity check
    results.checks.dataIntegrity = validateDataIntegrity();

    // Cache status
    results.checks.cacheStatus = {
      cacheEntries: Object.keys(cacheStore).length,
      cacheSize: JSON.stringify(cacheStore).length
    };

    // Rate limiting status
    results.checks.rateLimiting = {
      activeLimits: Object.keys(rateLimitStore).length
    };

    // Overall health
    const unhealthyChecks = Object.values(results.checks).filter(check =>
      check.status === 'unhealthy' || check.error
    );

    results.overallHealth = unhealthyChecks.length === 0 ? 'healthy' : 'unhealthy';
    results.unhealthyChecks = unhealthyChecks.length;

    return results;

  } catch (error) {
    console.error('Error running system health check:', error);
    return {
      timestamp: getCurrentTimestamp(),
      overallHealth: 'unhealthy',
      error: error.message
    };
  }
}

/**
 * Data integrity validation function
 */
function validateDataIntegrity() {
  try {
    const results = {
      userRoleIntegrity: validateUserRoleIntegrity(),
      complaintIntegrity: validateComplaintIntegrity(),
      rolePermissionIntegrity: validateRolePermissionIntegrity(),
      sheetStructure: {},
      timestamp: getCurrentTimestamp()
    };

    // Check sheet structure
    const requiredSheets = [
      'Customers', 'Profiles', 'User_Roles', 'Roles', 'Role_Permissions', 'Complaints', 'Complaint_History',
      'Complaint_Attachments', 'Notifications', 'System_Settings', 'System_Logs'
    ];

    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const existingSheets = ss.getSheets().map(s => s.getName());

    results.sheetStructure = {
      requiredSheets: requiredSheets.length,
      existingSheets: existingSheets.length,
      missingSheets: requiredSheets.filter(s => !existingSheets.includes(s)),
      extraSheets: existingSheets.filter(s => !requiredSheets.includes(s))
    };

    // Overall integrity status
    const hasIssues =
      results.userRoleIntegrity.profilesWithInvalidRoles > 0 ||
      results.userRoleIntegrity.profilesWithoutRoles > 0 ||
      results.complaintIntegrity.invalidComplaints > 0 ||
      results.rolePermissionIntegrity.orphanedPermissions > 0 ||
      results.rolePermissionIntegrity.rolesWithoutPermissions > 0 ||
      results.sheetStructure.missingSheets.length > 0;

    results.integrityStatus = hasIssues ? 'issues_found' : 'healthy';

    return results;

  } catch (error) {
    console.error('Error validating data integrity:', error);
    return {
      integrityStatus: 'error',
      error: error.message,
      timestamp: getCurrentTimestamp()
    };
  }
}

// ========== UTILITY FUNCTIONS ==========

function generateId() {
  return Utilities.getUuid();
}

function getCurrentTimestamp() {
  return new Date().toISOString();
}

function hashPassword(password) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8)
    .map(byte => (byte + 256).toString(16).slice(-2)).join('');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

function generateJWT(payload) {
  const header = Utilities.base64Encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }), Utilities.Charset.UTF_8);
  const payloadEncoded = Utilities.base64Encode(JSON.stringify(payload), Utilities.Charset.UTF_8);
  const signature = Utilities.base64Encode(Utilities.computeHmacSha256Signature(header + '.' + payloadEncoded, CONFIG.JWT_SECRET));
  return header + '.' + payloadEncoded + '.' + signature;
}

function verifyJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const signature = Utilities.base64Encode(Utilities.computeHmacSha256Signature(parts[0] + '.' + parts[1], CONFIG.JWT_SECRET));
    if (signature !== parts[2]) return null;

    const payload = JSON.parse(Utilities.newBlob(Utilities.base64Decode(parts[1])).getDataAsString());

    if (payload.exp && Date.now() > payload.exp) return null;

    return payload;
  } catch (e) {
    return null;
  }
}

function getRoleNameById(roleId) {
  try {
    const roles = getSheetData('Roles', { ID: roleId });
    return roles.length > 0 ? roles[0].Name : APP_ROLES.STAFF;
  } catch (error) {
    console.error('Error getting role name by ID:', error);
    return APP_ROLES.STAFF;
  }
}

function getRoleIdByName(roleName) {
  try {
    const roles = getSheetData('Roles', { Name: roleName });
    return roles.length > 0 ? roles[0].ID : null;
  } catch (error) {
    console.error('Error getting role ID by name:', error);
    return null;
  }
}

// ========== DATABASE OPERATIONS ==========

function getSheet(sheetName) {
  const sheet = SpreadsheetApp.openById(CONFIG.SHEET_ID).getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Sheet '${sheetName}' not found. Please ensure it exists and is correctly named.`);
  }
  return sheet;
}

function getSheetData(sheetName, filters = {}) {
  const sheet = getSheet(sheetName);

  const data = sheet.getDataRange().getValues();
  if (data.length === 0) return [];

  // Use actual headers from the sheet
  const headers = data[0];
  Logger.log(`Headers for ${sheetName}:`, headers);

  let result = data.slice(1);

  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined && filters[key] !== '') {
      const headerIndex = headers.indexOf(key);
      if (headerIndex !== -1) {
        result = result.filter(row => row[headerIndex] == filters[key]);
      }
    }
  });

  result = result.map((row, index) => {
    const obj = { _row: index + 2 };
    headers.forEach((header, colIndex) => {
      obj[header] = row[colIndex] || '';
    });
    return obj;
  });

  return result;
}

function insertRecord(sheetName, record) {
  const sheet = getSheet(sheetName);
  if (!sheet) {
    throw new Error(`Sheet ${sheetName} not found`);
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowData = headers.map(header => record[header] !== undefined ? record[header] : '');
  sheet.appendRow(rowData);
  return record;
}

function updateRecord(sheetName, record) {
  const sheet = getSheet(sheetName);
  if (!sheet) {
    throw new Error(`Sheet ${sheetName} not found`);
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) {
    throw new Error('No data in sheet');
  }
  
  const headers = data[0];
  let idIndex = headers.indexOf('ID');
  if (idIndex === -1) {
    idIndex = headers.findIndex(h => h.toLowerCase() === 'id');
  }
  
  if (idIndex === -1) {
    throw new Error(`ID column not found in sheet ${sheetName}`);
  }
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idIndex] === record.ID) {
      const rowData = headers.map(header => record[header] !== undefined ? record[header] : data[i][headers.indexOf(header)]);
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([rowData]);
      return record;
    }
  }
  throw new Error('Record not found');
}

// ========== SIMPLIFIED SEED DATA FUNCTIONS ==========

function seedAllData() {
  try {
    console.log('Starting data seeding...');

    // First, ensure sheets exist with correct headers
    initializeSheets();

    // Then seed data
    seedCustomers();
    seedRoles();
    seedRolePermissions();
    seedProfiles();
    seedComplaints();
    seedComplaintHistory();
    seedSystemSettings();

    console.log('All seed data inserted successfully!');
    return {
      success: true,
      message: 'Data seeding completed successfully'
    };

  } catch (error) {
    console.error('Error seeding data:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

function clearAllData() {
  try {
    console.log('Starting data clearing...');

    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheets = ss.getSheets();

    let clearedSheets = 0;
    let totalRowsCleared = 0;

    // Clear data from each sheet (keep headers)
    for (const sheet of sheets) {
      const sheetName = sheet.getName();

      // Skip system sheets that shouldn't be cleared
      if (sheetName === 'System_Logs' || sheetName === 'Roles' || sheetName === 'Role_Permissions') {
        console.log(`Skipping system sheet: ${sheetName}`);
        continue;
      }

      const dataRange = sheet.getDataRange();
      const rowCount = dataRange.getNumRows();

      if (rowCount > 1) {
        // Clear all rows except the header row
        const rowsToClear = rowCount - 1;
        sheet.getRange(2, 1, rowsToClear, dataRange.getNumColumns()).clearContent();
        totalRowsCleared += rowsToClear;
        clearedSheets++;
        console.log(`Cleared ${rowsToClear} rows from ${sheetName}`);
      } else {
        console.log(`No data to clear in ${sheetName}`);
      }
    }

    // Clear cache
    clearAllCache();

    // Log the clearing activity
    logActivity('DATABASE_CLEARED', 'system', 'system', {
      clearedSheets: clearedSheets,
      totalRowsCleared: totalRowsCleared,
      sheetsAffected: sheets.filter(s => s.getName() !== 'System_Logs').map(s => s.getName())
    });

    console.log(`Database cleared successfully! Cleared ${totalRowsCleared} rows from ${clearedSheets} sheets`);
    return {
      success: true,
      message: `Database cleared successfully! Removed ${totalRowsCleared} rows from ${clearedSheets} sheets.`,
      details: {
        clearedSheets: clearedSheets,
        totalRowsCleared: totalRowsCleared
      }
    };

  } catch (error) {
    console.error('Error clearing data:', error);
    logActivity('DATABASE_CLEAR_FAILED', 'system', 'system', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
}

function initializeSheets() {
  const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
  
  const sheetsConfig = [
    {
      name: 'Customers',
      headers: ['ID', 'Contract Account Number', 'Business Partner Number', 'Customer Name', 'Phone', 'Email', 'Address', 'Region', 'Service Center', 'Created At', 'Updated At']
    },
    {
      name: 'Profiles',
      headers: ['ID', 'Email', 'Full Name', 'Name', 'Phone', 'Region', 'Service Center', 'Active', 'PasswordHash', 'Role ID', 'Created At', 'Updated At', 'Last Login']
    },
    {
      name: 'Roles',
      headers: ['ID', 'Name', 'Description', 'Created At', 'Updated At']
    },
    {
      name: 'Role_Permissions',
      headers: ['ID', 'Role ID', 'Resource', 'View', 'Create', 'Edit', 'Delete', 'Created At', 'Updated At']
    },
    {
      name: 'Complaints',
      headers: ['ID', 'Ticket Number', 'Customer ID', 'Category', 'Priority', 'Status', 'Title', 'Description', 'Region', 'Service Center', 'Assigned To', 'Notes', 'Created At', 'Updated At', 'Resolved At']
    },
    {
      name: 'Complaint_History',
      headers: ['ID', 'Complaint ID', 'User ID', 'User Name', 'Action', 'Old Value', 'New Value', 'Notes', 'Created At']
    },
    {
      name: 'Complaint_Attachments',
      headers: ['ID', 'Complaint ID', 'File Name', 'File Path', 'File Type', 'File Size', 'Uploaded By', 'Uploaded At']
    },
    {
      name: 'Notifications',
      headers: ['ID', 'User ID', 'Type', 'Title', 'Message', 'Read', 'Related ID', 'Created At']
    },
    {
      name: 'General_Settings',
      headers: ['ID', 'Key', 'Value', 'Updated At', 'Updated By']
    },
    {
      name: 'Email_Settings',
      headers: ['ID', 'Key', 'Value', 'Updated At', 'Updated By']
    },
    {
      name: 'Notification_Settings',
      headers: ['ID', 'Key', 'Value', 'Updated At', 'Updated By']
    },
    {
      name: 'Security_Settings',
      headers: ['ID', 'Key', 'Value', 'Updated At', 'Updated By']
    },
    {
      name: 'Data_Settings',
      headers: ['ID', 'Key', 'Value', 'Updated At', 'Updated By']
    },
    {
      name: 'System_Settings',
      headers: ['ID', 'Key', 'Value', 'Updated At', 'Updated By']
    },
    {
      name: 'System_Logs',
      headers: ['Timestamp', 'Action', 'User ID', 'User Email', 'Details', 'IP Address', 'User Agent']
    }
  ];
  
  sheetsConfig.forEach(sheetConfig => {
    let sheet = ss.getSheetByName(sheetConfig.name);
    if (!sheet) {
      sheet = ss.insertSheet(sheetConfig.name);
      console.log(`Created sheet: ${sheetConfig.name}`);
    }
    
    // Set headers if sheet is empty or headers don't match
    const currentData = sheet.getDataRange().getValues();
    if (currentData.length === 0 || !arraysEqual(currentData[0], sheetConfig.headers)) {
      sheet.clear();
      sheet.getRange(1, 1, 1, sheetConfig.headers.length).setValues([sheetConfig.headers]);
      sheet.getRange(1, 1, 1, sheetConfig.headers.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
      console.log(`Set headers for: ${sheetConfig.name}`);
    }
  });
  
  return 'Sheets initialized successfully';
}

function arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
}

function seedCustomers() {
  const customerSheet = getSheet('Customers');
  if (customerSheet.getLastRow() > 1) {
    console.log('Customers sheet already contains data, skipping seeding.');
    return;
  }
  const customers = [
    {
      'ID': 'cust-001',
      'Contract Account Number': 'ACC-00123456',
      'Business Partner Number': 'BP-987654321',
      'Customer Name': 'Abebe Kebede',
      'Phone': '+251-911-123456',
      'Email': 'abebe.kebede@email.com',
      'Address': 'Bole, Addis Ababa',
      'Region': 'Addis Ababa',
      'Service Center': 'Bole Service Center',
      'Created At': '2024-01-01T08:00:00.000Z',
      'Updated At': '2024-01-01T08:00:00.000Z'
    },
    {
      'ID': 'cust-002',
      'Contract Account Number': 'ACC-00123457',
      'Business Partner Number': 'BP-987654322',
      'Customer Name': 'Meron Getachew',
      'Phone': '+251-911-123457',
      'Email': 'meron.getachew@email.com',
      'Address': 'Megenagna, Addis Ababa',
      'Region': 'Addis Ababa',
      'Service Center': 'Megenagna Service Center',
      'Created At': '2024-01-01T08:00:00.000Z',
      'Updated At': '2024-01-01T08:00:00.000Z'
    },
    {
      'ID': 'cust-003',
      'Contract Account Number': 'ACC-00123458',
      'Business Partner Number': 'BP-987654323',
      'Customer Name': 'Dawit Tesfaye',
      'Phone': '+251-911-123458',
      'Email': 'dawit.tesfaye@email.com',
      'Address': 'Kazanchis, Addis Ababa',
      'Region': 'Addis Ababa',
      'Service Center': 'Kazanchis Service Center',
      'Created At': '2024-01-01T08:00:00.000Z',
      'Updated At': '2024-01-01T08:00:00.000Z'
    }
  ];

  let insertedCount = 0;
  customers.forEach(customer => {
    try {
      insertRecord('Customers', customer);
      insertedCount++;
    } catch (error) {
      console.error(`Error inserting customer ${customer['Customer Name']}:`, error);
    }
  });
  console.log(`Inserted ${insertedCount} customers`);
  return insertedCount;
}

function seedProfiles() {
  const profileSheet = getSheet('Profiles');
  if (profileSheet.getLastRow() > 1) {
    console.log('Profiles sheet already contains data, skipping seeding.');
    return;
  }
  const profiles = [
    // Admin users
    {
      'ID': 'a1b2c3d4-1234-5678-9abc-123456789001',
      'Email': 'admin@eeu.gov.et',
      'Full Name': 'System Administrator',
      'Name': 'Admin',
      'Phone': '+251-911-123456',
      'Region': 'Addis Ababa',
      'Service Center': 'Head Office',
      'Active': true,
      'PasswordHash': hashPassword('12345678'),
      'Role ID': 'role-admin',
      'Created At': '2024-01-01T08:00:00.000Z',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Last Login': '2024-01-12T08:00:00.000Z'
    },
    {
      'ID': 'a1b2c3d4-1234-5678-9abc-123456789002',
      'Email': 'manager.oromia@eeu.gov.et',
      'Full Name': 'Oromia Manager',
      'Name': 'Manager',
      'Phone': '+251-911-123457',
      'Region': 'Oromia',
      'Service Center': 'Adama Service Center',
      'Active': true,
      'PasswordHash': hashPassword('12345678'),
      'Role ID': 'role-manager',
      'Created At': '2024-01-01T08:00:00.000Z',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Last Login': '2024-01-12T08:30:00.000Z'
    },
    // Staff users
    {
      'ID': 'a1b2c3d4-1234-5678-9abc-123456789003',
      'Email': 'staff.addis@eeu.gov.et',
      'Full Name': 'Addis Staff Member',
      'Name': 'Addis Staff',
      'Phone': '+251-911-123458',
      'Region': 'Addis Ababa',
      'Service Center': 'Bole Service Center',
      'Active': true,
      'PasswordHash': hashPassword('12345678'),
      'Role ID': 'role-staff',
      'Created At': '2024-01-01T08:00:00.000Z',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Last Login': '2024-01-12T09:00:00.000Z'
    },
    {
      'ID': 'a1b2c3d4-1234-5678-9abc-123456789005',
      'Email': 'staff2@eeu.gov.et',
      'Full Name': 'Meron Getachew',
      'Name': 'Meron',
      'Phone': '+251-911-123459',
      'Region': 'Addis Ababa',
      'Service Center': 'Megenagna Service Center',
      'Active': true,
      'PasswordHash': hashPassword('12345678'),
      'Role ID': 'role-staff',
      'Created At': '2024-01-01T08:00:00.000Z',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Last Login': '2024-01-12T09:15:00.000Z'
    }
  ];

  let insertedCount = 0;
  profiles.forEach(profile => {
    try {
      insertRecord('Profiles', profile);
      insertedCount++;
    } catch (error) {
      console.error(`Error inserting profile ${profile.Email}:`, error);
    }
  });
  console.log(`Inserted ${insertedCount} profiles`);
  return insertedCount;
}


function seedComplaints() {
  const complaintSheet = getSheet('Complaints');
  if (complaintSheet.getLastRow() > 1) {
    console.log('Complaints sheet already contains data, skipping seeding.');
    return;
  }
  const complaints = [
    {
      'ID': 'c1d2e3f4-1234-5678-9abc-123456789001',
      'Ticket Number': 'TKT-2024-001',
      'Customer ID': 'cust-001',
      'Category': 'billing',
      'Priority': 'high',
      'Status': 'open',
      'Title': 'Incorrect billing amount',
      'Description': 'I received a bill for 2,500 Birr but my actual consumption should be around 1,200 Birr. There seems to be a meter reading error.',
      'Region': 'Addis Ababa',
      'Service Center': 'Bole Service Center',
      'Assigned To': 'a1b2c3d4-1234-5678-9abc-123456789003',
      'Notes': 'Customer claims meter reading is incorrect. Need to verify meter reading and billing calculation.',
      'Created At': '2024-01-10T09:15:00.000Z',
      'Updated At': '2024-01-10T09:15:00.000Z',
      'Resolved At': ''
    },
    {
      'ID': 'c1d2e3f4-1234-5678-9abc-123456789002',
      'Ticket Number': 'TKT-2024-002',
      'Customer ID': 'cust-002',
      'Category': 'power_outage',
      'Priority': 'high',
      'Status': 'in_progress',
      'Title': 'No power for 24 hours',
      'Description': 'Our area has been without electricity for more than 24 hours. This is affecting our business operations.',
      'Region': 'Addis Ababa',
      'Service Center': 'Megenagna Service Center',
      'Assigned To': 'a1b2c3d4-1234-5678-9abc-123456789005',
      'Notes': 'Technical team dispatched to investigate transformer issue in Megenagna area.',
      'Created At': '2024-01-10T10:30:00.000Z',
      'Updated At': '2024-01-11T08:45:00.000Z',
      'Resolved At': ''
    }
  ];
  
  let insertedCount = 0;
  complaints.forEach(complaint => {
    try {
      insertRecord('Complaints', complaint);
      insertedCount++;
    } catch (error) {
      console.error(`Error inserting complaint ${complaint['Ticket Number']}:`, error);
    }
  });
  console.log(`Inserted ${insertedCount} complaints`);
  return insertedCount;
}

function seedComplaintHistory() {
  const complaintHistorySheet = getSheet('Complaint_History');
  if (complaintHistorySheet.getLastRow() > 1) {
    console.log('Complaint_History sheet already contains data, skipping seeding.');
    return;
  }
  const complaintHistory = [
    {
      'ID': generateId(),
      'Complaint ID': 'c1d2e3f4-1234-5678-9abc-123456789001',
      'User ID': 'a1b2c3d4-1234-5678-9abc-123456789001',
      'User Name': 'System Administrator',
      'Action': 'created',
      'Old Value': '',
      'New Value': 'open',
      'Notes': 'Complaint created',
      'Created At': '2024-01-10T09:15:00.000Z'
    },
    {
      'ID': generateId(),
      'Complaint ID': 'c1d2e3f4-1234-5678-9abc-123456789001',
      'User ID': 'a1b2c3d4-1234-5678-9abc-123456789003',
      'User Name': 'Abebe Kebede',
      'Action': 'assigned',
      'Old Value': '',
      'New Value': 'a1b2c3d4-1234-5678-9abc-123456789003',
      'Notes': 'Complaint assigned to Abebe Kebede',
      'Created At': '2024-01-10T09:30:00.000Z'
    }
  ];
  
  let insertedCount = 0;
  complaintHistory.forEach(history => {
    try {
      insertRecord('Complaint_History', history);
      insertedCount++;
    } catch (error) {
      console.error(`Error inserting complaint history:`, error);
    }
  });
  console.log(`Inserted ${insertedCount} complaint history records`);
  return insertedCount;
}

function seedRoles() {
  const rolesSheet = getSheet('Roles');
  if (rolesSheet.getLastRow() > 1) {
    console.log('Roles sheet already contains data, skipping seeding.');
    return;
  }
  const roles = [
    {
      'ID': 'role-admin',
      'Name': 'admin',
      'Description': 'Full system access and management capabilities',
      'Created At': '2024-01-01T08:00:00.000Z',
      'Updated At': '2024-01-01T08:00:00.000Z'
    },
    {
      'ID': 'role-manager',
      'Name': 'manager',
      'Description': 'Can manage complaints and view reports in their region',
      'Created At': '2024-01-01T08:00:00.000Z',
      'Updated At': '2024-01-01T08:00:00.000Z'
    },
    {
      'ID': 'role-staff',
      'Name': 'staff',
      'Description': 'Can handle and resolve customer complaints',
      'Created At': '2024-01-01T08:00:00.000Z',
      'Updated At': '2024-01-01T08:00:00.000Z'
    },
    {
      'ID': 'role-customer',
      'Name': 'customer',
      'Description': 'Can create and view their own complaints',
      'Created At': '2024-01-01T08:00:00.000Z',
      'Updated At': '2024-01-01T08:00:00.000Z'
    }
  ];

  let insertedCount = 0;
  roles.forEach(role => {
    try {
      insertRecord('Roles', role);
      insertedCount++;
    } catch (error) {
      console.error(`Error inserting role ${role.Name}:`, error);
    }
  });
  console.log(`Inserted ${insertedCount} roles`);
  return insertedCount;
}

function seedRolePermissions() {
  const rolePermissionsSheet = getSheet('Role_Permissions');
  if (rolePermissionsSheet.getLastRow() > 1) {
    console.log('Role_Permissions sheet already contains data, skipping seeding.');
    return;
  }

  const permissions = [
    // Admin permissions
    { 'ID': generateId(), 'Role ID': 'role-admin', 'Resource': 'Complaints', 'View': true, 'Create': true, 'Edit': true, 'Delete': true, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' },
    { 'ID': generateId(), 'Role ID': 'role-admin', 'Resource': 'Users', 'View': true, 'Create': true, 'Edit': true, 'Delete': true, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' },
    { 'ID': generateId(), 'Role ID': 'role-admin', 'Resource': 'Reports', 'View': true, 'Create': true, 'Edit': true, 'Delete': true, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' },
    { 'ID': generateId(), 'Role ID': 'role-admin', 'Resource': 'Settings', 'View': true, 'Create': true, 'Edit': true, 'Delete': true, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' },
    { 'ID': generateId(), 'Role ID': 'role-admin', 'Resource': 'Analytics', 'View': true, 'Create': true, 'Edit': true, 'Delete': true, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' },
    { 'ID': generateId(), 'Role ID': 'role-admin', 'Resource': 'Permissions', 'View': true, 'Create': true, 'Edit': true, 'Delete': true, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' },

    // Manager permissions
    { 'ID': generateId(), 'Role ID': 'role-manager', 'Resource': 'Complaints', 'View': true, 'Create': true, 'Edit': true, 'Delete': false, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' },
    { 'ID': generateId(), 'Role ID': 'role-manager', 'Resource': 'Users', 'View': true, 'Create': false, 'Edit': false, 'Delete': false, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' },
    { 'ID': generateId(), 'Role ID': 'role-manager', 'Resource': 'Reports', 'View': true, 'Create': true, 'Edit': true, 'Delete': false, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' },
    { 'ID': generateId(), 'Role ID': 'role-manager', 'Resource': 'Settings', 'View': false, 'Create': false, 'Edit': false, 'Delete': false, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' },
    { 'ID': generateId(), 'Role ID': 'role-manager', 'Resource': 'Analytics', 'View': true, 'Create': false, 'Edit': false, 'Delete': false, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' },
    { 'ID': generateId(), 'Role ID': 'role-manager', 'Resource': 'Permissions', 'View': false, 'Create': false, 'Edit': false, 'Delete': false, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' },

    // Staff permissions
    { 'ID': generateId(), 'Role ID': 'role-staff', 'Resource': 'Complaints', 'View': true, 'Create': true, 'Edit': true, 'Delete': false, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' },
    { 'ID': generateId(), 'Role ID': 'role-staff', 'Resource': 'Users', 'View': false, 'Create': false, 'Edit': false, 'Delete': false, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' },
    { 'ID': generateId(), 'Role ID': 'role-staff', 'Resource': 'Reports', 'View': true, 'Create': false, 'Edit': false, 'Delete': false, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' },
    { 'ID': generateId(), 'Role ID': 'role-staff', 'Resource': 'Settings', 'View': false, 'Create': false, 'Edit': false, 'Delete': false, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' },
    { 'ID': generateId(), 'Role ID': 'role-staff', 'Resource': 'Analytics', 'View': false, 'Create': false, 'Edit': false, 'Delete': false, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' },
    { 'ID': generateId(), 'Role ID': 'role-staff', 'Resource': 'Permissions', 'View': false, 'Create': false, 'Edit': false, 'Delete': false, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' },

    // Customer permissions
    { 'ID': generateId(), 'Role ID': 'role-customer', 'Resource': 'Complaints', 'View': true, 'Create': true, 'Edit': false, 'Delete': false, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' },
    { 'ID': generateId(), 'Role ID': 'role-customer', 'Resource': 'Users', 'View': false, 'Create': false, 'Edit': false, 'Delete': false, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' },
    { 'ID': generateId(), 'Role ID': 'role-customer', 'Resource': 'Reports', 'View': false, 'Create': false, 'Edit': false, 'Delete': false, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' },
    { 'ID': generateId(), 'Role ID': 'role-customer', 'Resource': 'Settings', 'View': false, 'Create': false, 'Edit': false, 'Delete': false, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' },
    { 'ID': generateId(), 'Role ID': 'role-customer', 'Resource': 'Analytics', 'View': false, 'Create': false, 'Edit': false, 'Delete': false, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' },
    { 'ID': generateId(), 'Role ID': 'role-customer', 'Resource': 'Permissions', 'View': false, 'Create': false, 'Edit': false, 'Delete': false, 'Created At': '2024-01-01T08:00:00.000Z', 'Updated At': '2024-01-01T08:00:00.000Z' }
  ];

  let insertedCount = 0;
  permissions.forEach(permission => {
    try {
      insertRecord('Role_Permissions', permission);
      insertedCount++;
    } catch (error) {
      console.error(`Error inserting role permission:`, error);
    }
  });
  console.log(`Inserted ${insertedCount} role permissions`);
  return insertedCount;
}

function seedSystemSettings() {
  // Seed General Settings
  seedGeneralSettings();

  // Seed Email Settings
  seedEmailSettings();

  // Seed Notification Settings
  seedNotificationSettings();

  // Seed Security Settings
  seedSecuritySettings();

  // Seed Data Settings
  seedDataSettings();

  // Seed legacy System Settings (for backward compatibility)
  seedLegacySystemSettings();
}

function seedGeneralSettings() {
  const generalSettingsSheet = getSheet('General_Settings');
  if (generalSettingsSheet.getLastRow() > 1) {
    console.log('General_Settings sheet already contains data, skipping seeding.');
    return;
  }

  const settings = [
    {
      'ID': generateId(),
      'Key': 'system_name',
      'Value': 'Ethiopian Electric Utility - Complaint Management System',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    },
    {
      'ID': generateId(),
      'Key': 'timezone',
      'Value': 'Africa/Addis_Ababa',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    },
    {
      'ID': generateId(),
      'Key': 'language',
      'Value': 'en',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    },
    {
      'ID': generateId(),
      'Key': 'date_format',
      'Value': 'dd/MM/yyyy',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    }
  ];

  let insertedCount = 0;
  settings.forEach(setting => {
    try {
      insertRecord('General_Settings', setting);
      insertedCount++;
    } catch (error) {
      console.error(`Error inserting general setting ${setting.Key}:`, error);
    }
  });
  console.log(`Inserted ${insertedCount} general settings`);
  return insertedCount;
}

function seedEmailSettings() {
  const emailSettingsSheet = getSheet('Email_Settings');
  if (emailSettingsSheet.getLastRow() > 1) {
    console.log('Email_Settings sheet already contains data, skipping seeding.');
    return;
  }

  const settings = [
    {
      'ID': generateId(),
      'Key': 'email_enabled',
      'Value': 'true',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    },
    {
      'ID': generateId(),
      'Key': 'email_host',
      'Value': 'smtp.gmail.com',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    },
    {
      'ID': generateId(),
      'Key': 'email_port',
      'Value': '587',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    },
    {
      'ID': generateId(),
      'Key': 'email_username',
      'Value': 'notifications@eeu.gov.et',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    },
    {
      'ID': generateId(),
      'Key': 'email_from',
      'Value': 'EEU CMS <notifications@eeu.gov.et>',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    }
  ];

  let insertedCount = 0;
  settings.forEach(setting => {
    try {
      insertRecord('Email_Settings', setting);
      insertedCount++;
    } catch (error) {
      console.error(`Error inserting email setting ${setting.Key}:`, error);
    }
  });
  console.log(`Inserted ${insertedCount} email settings`);
  return insertedCount;
}

function seedNotificationSettings() {
  const notificationSettingsSheet = getSheet('Notification_Settings');
  if (notificationSettingsSheet.getLastRow() > 1) {
    console.log('Notification_Settings sheet already contains data, skipping seeding.');
    return;
  }

  const settings = [
    {
      'ID': generateId(),
      'Key': 'notify_on_new_complaint',
      'Value': 'true',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    },
    {
      'ID': generateId(),
      'Key': 'notify_on_assignment',
      'Value': 'true',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    },
    {
      'ID': generateId(),
      'Key': 'notify_on_status_change',
      'Value': 'true',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    },
    {
      'ID': generateId(),
      'Key': 'notify_on_resolution',
      'Value': 'true',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    },
    {
      'ID': generateId(),
      'Key': 'auto_assignment',
      'Value': 'true',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    },
    {
      'ID': generateId(),
      'Key': 'assign_by_region',
      'Value': 'true',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    },
    {
      'ID': generateId(),
      'Key': 'assign_by_workload',
      'Value': 'true',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    }
  ];

  let insertedCount = 0;
  settings.forEach(setting => {
    try {
      insertRecord('Notification_Settings', setting);
      insertedCount++;
    } catch (error) {
      console.error(`Error inserting notification setting ${setting.Key}:`, error);
    }
  });
  console.log(`Inserted ${insertedCount} notification settings`);
  return insertedCount;
}

function seedSecuritySettings() {
  const securitySettingsSheet = getSheet('Security_Settings');
  if (securitySettingsSheet.getLastRow() > 1) {
    console.log('Security_Settings sheet already contains data, skipping seeding.');
    return;
  }

  const settings = [
    {
      'ID': generateId(),
      'Key': 'session_timeout',
      'Value': '30',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    },
    {
      'ID': generateId(),
      'Key': 'password_expiry',
      'Value': '90',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    },
    {
      'ID': generateId(),
      'Key': 'max_login_attempts',
      'Value': '5',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    },
    {
      'ID': generateId(),
      'Key': 'two_factor_enabled',
      'Value': 'false',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    }
  ];

  let insertedCount = 0;
  settings.forEach(setting => {
    try {
      insertRecord('Security_Settings', setting);
      insertedCount++;
    } catch (error) {
      console.error(`Error inserting security setting ${setting.Key}:`, error);
    }
  });
  console.log(`Inserted ${insertedCount} security settings`);
  return insertedCount;
}

function seedDataSettings() {
  const dataSettingsSheet = getSheet('Data_Settings');
  if (dataSettingsSheet.getLastRow() > 1) {
    console.log('Data_Settings sheet already contains data, skipping seeding.');
    return;
  }

  const settings = [
    {
      'ID': generateId(),
      'Key': 'archive_after_days',
      'Value': '365',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    },
    {
      'ID': generateId(),
      'Key': 'delete_after_days',
      'Value': '730',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    },
    {
      'ID': generateId(),
      'Key': 'backup_enabled',
      'Value': 'true',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    },
    {
      'ID': generateId(),
      'Key': 'backup_frequency',
      'Value': 'daily',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    }
  ];

  let insertedCount = 0;
  settings.forEach(setting => {
    try {
      insertRecord('Data_Settings', setting);
      insertedCount++;
    } catch (error) {
      console.error(`Error inserting data setting ${setting.Key}:`, error);
    }
  });
  console.log(`Inserted ${insertedCount} data settings`);
  return insertedCount;
}

function seedLegacySystemSettings() {
  const systemSettingsSheet = getSheet('System_Settings');
  if (systemSettingsSheet.getLastRow() > 1) {
    console.log('System_Settings sheet already contains data, skipping seeding.');
    return;
  }

  const settings = [
    {
      'ID': generateId(),
      'Key': 'system_version',
      'Value': '3.2.2',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    },
    {
      'ID': generateId(),
      'Key': 'maintenance_mode',
      'Value': 'false',
      'Updated At': '2024-01-01T08:00:00.000Z',
      'Updated By': 'system'
    }
  ];

  let insertedCount = 0;
  settings.forEach(setting => {
    try {
      insertRecord('System_Settings', setting);
      insertedCount++;
    } catch (error) {
      console.error(`Error inserting legacy system setting ${setting.Key}:`, error);
    }
  });
  console.log(`Inserted ${insertedCount} legacy system settings`);
  return insertedCount;
}

// ========== MAIN API FUNCTIONS ==========

function doOptions(e) {
  const response = ContentService.createTextOutput()
    .setMimeType(ContentService.MimeType.JSON);

  // CORS headers are handled by the proxy server, not GAS directly
  // GAS setHeader() method is not available in all environments

  return response;
}

function handleRequest(e) {
  // This function will handle both GET and POST requests
  if (!e) {
    // This case should ideally not be reached in a web app context
    return createResponse({ error: 'Request event object is missing.' }, 500);
  }

  try {
    const isPost = e.postData && e.postData.contents;

    let path, action, data;

    if (isPost) {
      // It's a POST request
      const requestData = JSON.parse(e.postData.contents);
      Logger.log('Incoming POST request:', requestData);
      path = requestData.path;
      action = requestData.action;
      data = requestData.data;
    } else {
      // It's a GET request
      Logger.log('Incoming GET request:', e.parameter);
      path = e.pathInfo || (e.parameter ? e.parameter.path : undefined);
      action = e.parameter ? e.parameter.action || 'get' : 'get';
      data = e.parameters;
    }
    return routeRequest(path, action, data, e);
  } catch (error) {
    console.error('Error in handleRequest:', error);
    return createResponse({ error: `Failed to handle request: ${error.message}` }, 400);
  }
}

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function routeRequest(path, action, data, e) {
  try {
    Logger.log(`Routing request: path=${path}, action=${action}`);

    // Handle undefined path
    if (!path) {
      return createResponse({ error: 'Path is required' }, 400);
    }

    // Normalize path by removing leading slash
    const normalizedPath = path.startsWith('/') ? path.substring(1) : path;

    switch (normalizedPath) {
      case 'auth/login':
        return handleLogin(data);
      
      case 'customers':
        if (action === 'get') return handleGetCustomers(data);
        if (action === 'create') return handleCreateCustomer(data);
        if (action === 'search') return handleSearchCustomers(data);
        break;

      case 'complaints':
        if (action === 'get') return handleGetComplaints(data);
        if (action === 'create') return handleCreateComplaint(data);
        if (action === 'update') return handleUpdateComplaint(data);
        if (action === 'delete') return handleDeleteComplaint(data);
        break;

      case 'users':
        if (action === 'get') return handleGetUsers(data);
        if (action === 'create') return handleCreateUser(data);
        if (action === 'update') return handleUpdateUser(data);
        if (action === 'delete') return handleDeleteUser(data);
        break;
      
      case 'users/manage':
        if (action === 'get') return handleGetUsers(data);
        if (action === 'update') return handleUpdateUser(data);
        if (action === 'delete') return handleDeleteUser(data);
        break;

      case 'users/export':
        if (action === 'export') return handleExportUsers(data);
        break;

      case 'seed-data':
        return createResponse(seedAllData());

      case 'initialize-sheets':
        return createResponse({ success: true, message: initializeSheets() });

      case 'activities':
        if (action === 'get') return handleGetActivities(data);
        break;

      case 'test-connection':
        return createResponse({
          success: true,
          message: 'Connected to Google Apps Script',
          timestamp: getCurrentTimestamp(),
          sheetId: CONFIG.SHEET_ID
        });

      case 'system-settings':
        if (action === 'get') return handleGetSystemSetting(data);
        if (action === 'update') return handleUpdateSystemSetting(data);
        break;

      case 'settings':
        if (action === 'get') return handleGetAllSettings(data);
        if (action === 'update') return handleUpdateSettings(data);
        break;

      case 'permissions':
        if (action === 'get') return handleGetPermissions(data);
        if (action === 'update') return handleUpdatePermissions(data);
        break;

      case 'backup':
        if (action === 'create') return createResponse(createBackup(data.type || 'manual'));
        if (action === 'list') return createResponse(listBackups());
        break;

      case 'system-health':
        if (action === 'check') return createResponse(runSystemHealthCheck());
        break;

      case 'data-integrity':
        if (action === 'validate') return createResponse(validateDataIntegrity());
        break;

      case 'logs':
        if (action === 'get') return createResponse(getActivityLogs(data, data.limit || 100));
        break;

      default:
        // Handle dynamic paths like /complaints/{id}
        if (normalizedPath && normalizedPath.startsWith('complaints/')) {
          const parts = normalizedPath.split('/');
          const complaintId = parts[1];
          if (parts.length === 2) {
            if (action === 'get') return handleGetComplaintById(complaintId);
            if (action === 'update') return handleUpdateComplaint({ ...data, ID: complaintId });
            if (action === 'delete') return handleDeleteComplaint({ ...data, ID: complaintId });
          } else if (parts.length === 3 && parts[2] === 'attachments') {
            if (action === 'get') return handleGetAttachments(complaintId);
            if (action === 'upload') return handleUploadAttachment({ ...data, complaintId });
          }
        }
        if (normalizedPath && normalizedPath.startsWith('attachments/')) {
          const parts = normalizedPath.split('/');
          const attachmentId = parts[1];
          if (parts.length === 3 && parts[2] === 'download') {
            if (action === 'download') return handleDownloadAttachment(attachmentId);
          } else if (parts.length === 2) {
            if (action === 'delete') return handleDeleteAttachment(attachmentId);
          }
        }
        break;
    }

    return createResponse({ error: `Path not found or action not supported: ${path}` }, 404);

  } catch (error) {
    console.error(`Error routing request for path "${path}":`, error.message, error.stack);
    return createResponse({ error: `An error occurred while processing the request: ${error.message}` }, 500);
  }
}

function handleLogin(loginData) {
  try {
    // Input validation
    const email = validateRequired(loginData.email, 'Email');
    const password = validateRequired(loginData.password, 'Password');

    if (!validateEmail(email)) {
      logActivity('LOGIN_FAILED', '', email, { reason: 'Invalid email format' });
      return createResponse({ error: 'Invalid email format' }, 400);
    }

    // Rate limiting check
    const clientId = email.toLowerCase();
    if (!rateLimitStore[clientId]) {
      rateLimitStore[clientId] = { count: 0, resetTime: Date.now() + CONFIG.RATE_LIMIT_WINDOW_MS };
    }

    const clientLimit = rateLimitStore[clientId];
    if (Date.now() > clientLimit.resetTime) {
      clientLimit.count = 0;
      clientLimit.resetTime = Date.now() + CONFIG.RATE_LIMIT_WINDOW_MS;
    }

    if (clientLimit.count >= CONFIG.MAX_LOGIN_ATTEMPTS) {
      logActivity('LOGIN_BLOCKED', '', email, { reason: 'Rate limit exceeded' });
      return createResponse({ error: 'Too many login attempts. Please try again later.' }, 429);
    }

    const profiles = getSheetData('Profiles', { 'Email': email });
    if (profiles.length === 0) {
      clientLimit.count++;
      logActivity('LOGIN_FAILED', '', email, { reason: 'User not found' });
      return createResponse({ error: 'Invalid email or password' }, 401);
    }

    const userProfile = profiles[0];
    if (!verifyPassword(password, userProfile.PasswordHash)) {
      clientLimit.count++;
      logActivity('LOGIN_FAILED', userProfile.ID, email, { reason: 'Invalid password' });
      return createResponse({ error: 'Invalid email or password' }, 401);
    }

    // Reset rate limit on successful login
    clientLimit.count = 0;

    // Get user role from profile
    const userRole = userProfile['Role ID'] ? getRoleNameById(userProfile['Role ID']) : APP_ROLES.STAFF;

    // Update last login
    try {
      updateRecord('Profiles', {
        'ID': userProfile.ID,
        'Last Login': getCurrentTimestamp()
      });
    } catch (updateError) {
      console.warn('Could not update last login:', updateError);
    }

    const tokenPayload = {
      userId: userProfile.ID,
      email: userProfile.Email,
      role: userRole,
      exp: Date.now() + CONFIG.SESSION_DURATION
    };

    const token = generateJWT(tokenPayload);

    logActivity('LOGIN_SUCCESS', userProfile.ID, email, {
      role: userRole,
      region: userProfile.Region
    });

    return createResponse({
      success: true,
      user: {
        id: userProfile.ID,
        email: userProfile.Email,
        name: userProfile.Name,
        full_name: userProfile['Full Name'],
        role: userRole,
        region: userProfile.Region,
        service_center: userProfile['Service Center']
      },
      token: token
    });

  } catch (error) {
    console.error('Login error:', error);
    logActivity('LOGIN_ERROR', '', loginData.email || 'unknown', { error: error.message });
    return createResponse({ error: 'Login failed due to server error' }, 500);
  }
}

function handleGetCustomers(filters = {}) {
  try {
    const customers = getSheetData('Customers', filters);
    return createResponse({
      success: true,
      data: customers,
      count: customers.length
    });
  } catch (error) {
    console.error('Error getting customers:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleSearchCustomers(searchData) {
  try {
    const { contractAccountNumber, businessPartnerNumber } = searchData;
    const filters = {};

    if (contractAccountNumber) {
      filters['Contract Account Number'] = contractAccountNumber;
    }
    if (businessPartnerNumber) {
      filters['Business Partner Number'] = businessPartnerNumber;
    }

    if (Object.keys(filters).length === 0) {
      return createResponse({ error: 'At least one search parameter is required' }, 400);
    }

    const customers = getSheetData('Customers', filters);

    if (customers.length === 0) {
      return createResponse({
        success: true,
        data: [],
        message: 'No customers found with the provided criteria'
      });
    }

    return createResponse({
      success: true,
      data: customers,
      count: customers.length
    });
  } catch (error) {
    console.error('Error searching customers:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleCreateCustomer(customerData) {
  try {
    // Input validation
    const contractAccountNumber = validateRequired(customerData.contractAccountNumber, 'Contract Account Number');
    const businessPartnerNumber = validateRequired(customerData.businessPartnerNumber, 'Business Partner Number');
    const customerName = validateRequired(customerData.customerName, 'Customer Name');

    // Check if customer already exists
    const existingCustomers = getSheetData('Customers', {
      'Contract Account Number': contractAccountNumber,
      'Business Partner Number': businessPartnerNumber
    });

    if (existingCustomers.length > 0) {
      return createResponse({ error: 'Customer with this contract account or business partner number already exists' }, 400);
    }

    const customer = {
      'ID': generateId(),
      'Contract Account Number': contractAccountNumber,
      'Business Partner Number': businessPartnerNumber,
      'Customer Name': customerName,
      'Phone': customerData.phone || '',
      'Email': customerData.email || '',
      'Address': customerData.address || '',
      'Region': customerData.region || '',
      'Service Center': customerData.serviceCenter || '',
      'Created At': getCurrentTimestamp(),
      'Updated At': getCurrentTimestamp()
    };

    insertRecord('Customers', customer);

    return createResponse({
      success: true,
      data: customer,
      message: 'Customer created successfully'
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleGetComplaints(filters = {}) {
  try {
    const complaints = getSheetData('Complaints', filters);

    // If we need customer details, join with customers table
    if (filters.includeCustomerDetails) {
      const customers = getSheetData('Customers');
      const customerMap = {};
      customers.forEach(customer => {
        customerMap[customer.ID] = customer;
      });

      complaints.forEach(complaint => {
        if (complaint['Customer ID'] && customerMap[complaint['Customer ID']]) {
          complaint.customerDetails = customerMap[complaint['Customer ID']];
        }
      });
    }

    return createResponse({
      success: true,
      data: complaints,
      count: complaints.length
    });
  } catch (error) {
    console.error('Error getting complaints:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleCreateComplaint(complaintData) {
  try {
    // Input validation
    const title = validateRequired(complaintData.title, 'Title');
    validateLength(title, 'Title', 5, 200);

    const description = validateRequired(complaintData.description, 'Description');
    validateLength(description, 'Description', 10, 2000);

    // Validate enums
    if (complaintData.category) {
      validateEnum(complaintData.category, 'Category',
        ['power_outage', 'billing', 'connection', 'meter', 'maintenance', 'other']);
    }

    if (complaintData.priority) {
      validateEnum(complaintData.priority, 'Priority',
        ['critical', 'high', 'medium', 'low']);
    }

    // Sanitize inputs
    const notes = sanitizeInput(complaintData.notes || '');

    let customerId = complaintData.customer_id;

    // If no customer_id provided, we need to handle customer creation/search
    if (!customerId) {
      if (complaintData.customer_type === 'existing') {
        // For existing customers, customer_id should be provided from search
        throw new Error('Customer ID is required for existing customers');
      } else if (complaintData.customer_type === 'new') {
        // For new customers, create the customer first
        const customerResult = handleCreateCustomer({
          contractAccountNumber: complaintData.contract_account_number,
          businessPartnerNumber: complaintData.business_partner_number,
          customerName: complaintData.customer_name,
          phone: complaintData.customer_phone,
          email: complaintData.customer_email,
          address: complaintData.customer_address,
          region: complaintData.region,
          serviceCenter: complaintData.service_center
        });

        if (!customerResult.success) {
          throw new Error('Failed to create customer: ' + customerResult.error);
        }

        customerId = customerResult.data.ID;
      }
    }

    const complaint = {
      'ID': generateId(),
      'Ticket Number': generateTicketNumber(),
      'Customer ID': customerId,
      'Category': complaintData.category || 'other',
      'Priority': complaintData.priority || 'medium',
      'Status': 'open',
      'Title': title,
      'Description': description,
      'Region': complaintData.region || '',
      'Service Center': complaintData.service_center || '',
      'Assigned To': complaintData.assigned_to || '',
      'Notes': notes,
      'Created At': getCurrentTimestamp(),
      'Updated At': getCurrentTimestamp(),
      'Resolved At': ''
    };

    insertRecord('Complaints', complaint);

    // Add to complaint history
    const historyRecord = {
      'ID': generateId(),
      'Complaint ID': complaint.ID,
      'User ID': complaintData.user_id || '',
      'User Name': complaintData.user_name || '',
      'Action': 'created',
      'Old Value': '',
      'New Value': 'open',
      'Notes': 'Complaint created',
      'Created At': getCurrentTimestamp()
    };

    insertRecord('Complaint_History', historyRecord);

    logActivity('COMPLAINT_CREATED', complaintData.user_id || '', complaintData.user_name || '', {
      ticketNumber: complaint['Ticket Number'],
      category: complaint.Category,
      priority: complaint.Priority,
      assignedTo: complaint['Assigned To']
    });

    return createResponse({
      success: true,
      data: complaint,
      message: 'Complaint created successfully'
    });
  } catch (error) {
    console.error('Error creating complaint:', error);
    logActivity('COMPLAINT_CREATE_FAILED', complaintData.user_id || '', complaintData.user_name || '', {
      error: error.message,
      title: complaintData.title
    });
    return createResponse({ error: error.message }, 500);
  }
}

function handleUpdateComplaint(complaintData) {
  try {
    const { ID, user_id, user_name, ...updatedFields } = complaintData;

    if (!ID) {
      throw new Error('Complaint ID is required for update');
    }

    const existingComplaints = getSheetData('Complaints', { ID: ID });
    if (existingComplaints.length === 0) {
      throw new Error('Complaint not found');
    }
    const existingComplaint = existingComplaints[0];

    const complaint = {
      ...existingComplaint,
      ...updatedFields,
      'Updated At': getCurrentTimestamp()
    };

    updateRecord('Complaints', complaint);

    // Add to complaint history
    const historyRecord = {
      'ID': generateId(),
      'Complaint ID': complaint.ID,
      'User ID': user_id || '',
      'User Name': user_name || '',
      'Action': 'updated',
      'Old Value': JSON.stringify(existingComplaint),
      'New Value': JSON.stringify(complaint),
      'Notes': 'Complaint updated',
      'Created At': getCurrentTimestamp()
    };

    insertRecord('Complaint_History', historyRecord);

    return createResponse({
      success: true,
      message: 'Complaint updated successfully'
    });
  } catch (error) {
    console.error('Error updating complaint:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleGetComplaintById(complaintId) {
  try {
    if (!complaintId) {
      throw new Error('Complaint ID is required');
    }

    const complaints = getSheetData('Complaints', { ID: complaintId });
    if (complaints.length === 0) {
      throw new Error('Complaint not found');
    }

    const complaint = complaints[0];

    // Convert to frontend expected format
    const formattedComplaint = {
      id: complaint.ID,
      ticketNumber: complaint['Ticket Number'],
      customerId: complaint['Customer ID'],
      customerName: complaint['Customer Name'],
      customerPhone: complaint['Customer Phone'],
      customerEmail: complaint['Customer Email'],
      customerAddress: complaint['Customer Address'],
      contractAccountNumber: complaint['Contract Account Number'],
      businessPartnerNumber: complaint['Business Partner Number'],
      category: complaint.Category,
      priority: complaint.Priority,
      status: complaint.Status,
      title: complaint.Title,
      description: complaint.Description,
      region: complaint.Region,
      serviceCenter: complaint['Service Center'],
      assignedTo: complaint['Assigned To'],
      notes: complaint.Notes,
      createdAt: complaint['Created At'],
      updatedAt: complaint['Updated At'],
      resolvedAt: complaint['Resolved At']
    };

    return createResponse({
      success: true,
      data: formattedComplaint
    });
  } catch (error) {
    console.error('Error getting complaint by ID:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleDeleteComplaint(complaintData) {
  try {
    const { ID, user_id, user_name } = complaintData;

    if (!ID) {
      throw new Error('Complaint ID is required for deletion');
    }

    const complaintSheet = getSheet('Complaints');
    const complaintDataRange = complaintSheet.getDataRange().getValues();
    const complaintHeaders = complaintDataRange[0];
    const complaintIdIndex = complaintHeaders.indexOf('ID');

    let rowIndexToDelete = -1;
    let deletedComplaint = null;

    for (let i = 1; i < complaintDataRange.length; i++) {
      if (complaintDataRange[i][complaintIdIndex] === ID) {
        rowIndexToDelete = i + 1;
        deletedComplaint = {};
        complaintHeaders.forEach((header, colIndex) => {
          deletedComplaint[header] = complaintDataRange[i][colIndex];
        });
        break;
      }
    }

    if (rowIndexToDelete === -1) {
      throw new Error('Complaint not found');
    }

    complaintSheet.deleteRow(rowIndexToDelete);

    // Add to complaint history
    const historyRecord = {
      'ID': generateId(),
      'Complaint ID': ID,
      'User ID': user_id || '',
      'User Name': user_name || '',
      'Action': 'deleted',
      'Old Value': JSON.stringify(deletedComplaint),
      'New Value': '',
      'Notes': 'Complaint deleted',
      'Created At': getCurrentTimestamp()
    };

    insertRecord('Complaint_History', historyRecord);

    return createResponse({
      success: true,
      message: 'Complaint deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function generateTicketNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  // Get count of complaints for today
  const todayComplaints = getSheetData('Complaints').filter(c => {
    const createdDate = new Date(c['Created At']);
    return createdDate.toDateString() === now.toDateString();
  });

  const sequence = String(todayComplaints.length + 1).padStart(3, '0');
  return `TKT-${year}-${month}${day}-${sequence}`;
}

function handleGetUsers(filters = {}) {
  try {
    const profiles = getSheetData('Profiles', filters);

    if (!Array.isArray(profiles)) {
      throw new Error('Failed to retrieve data from Profiles sheet.');
    }

    const users = profiles.map((profile, index) => {
      try {
        if (!profile || typeof profile !== 'object') {
          throw new Error(`Profile at index ${index} is not a valid object.`);
        }

        const roleName = profile['Role ID'] ? getRoleNameById(profile['Role ID']) : 'staff';

        const user = {
          id: profile.ID,
          email: profile.Email,
          name: profile['Full Name'] || profile.Name,
          role: roleName,
          region: profile.Region,
          serviceCenter: profile['Service Center'],
          active: profile.Active === true || String(profile.Active).toLowerCase() === 'true',
          createdAt: profile['Created At']
        };
        return user;
      } catch (innerError) {
        // Throw a new error that includes information about the problematic profile
        throw new Error(`Error processing profile at index ${index}: ${innerError.message}. Profile data: ${JSON.stringify(profile)}`);
      }
    });

    const responseData = {
      success: true,
      data: users.filter(Boolean),
      count: users.filter(Boolean).length
    };

    return createResponse(responseData);
  } catch (error) {
    console.error('Error in handleGetUsers:', error.message, error.stack);
    // Make sure the error message is detailed in the response
    return createResponse({ error: 'An internal error occurred while fetching users: ' + error.message }, 500);
  }
}

function handleCreateUser(userData) {
  try {
    const userId = generateId();
    const roleId = getRoleIdByName(userData.role || 'staff');

    // Create profile record
    const profile = {
      'ID': userId,
      'Email': userData.email,
      'Full Name': userData.name,
      'Name': userData.name.split(' ')[0],
      'Phone': userData.phone || '',
      'Region': userData.region || '',
      'Service Center': userData.serviceCenter || '',
      'Active': userData.active !== false,
      'PasswordHash': hashPassword(userData.password),
      'Role ID': roleId,
      'Created At': getCurrentTimestamp(),
      'Updated At': getCurrentTimestamp(),
      'Last Login': ''
    };

    insertRecord('Profiles', profile);

    return createResponse({
      success: true,
      data: {
        id: userId,
        email: profile.Email,
        name: profile['Full Name'],
        role: userData.role || 'staff',
        region: profile.Region,
        serviceCenter: profile['Service Center'],
        active: profile.Active
      },
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleUpdateUser(userData) {
  try {
    const { userId, name, role, region, serviceCenter, active } = userData;

    // Get role ID if role name is provided
    let roleId = undefined;
    if (role) {
      roleId = getRoleIdByName(role);
    }

    // Update profile
    const profile = {
      'ID': userId,
      'Full Name': name,
      'Region': region || '',
      'Service Center': serviceCenter || '',
      'Active': active !== false,
      'Updated At': getCurrentTimestamp()
    };

    // Add role ID to update if provided
    if (roleId !== undefined) {
      profile['Role ID'] = roleId;
    }

    updateRecord('Profiles', profile);

    return createResponse({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleDeleteUser(userData) {
  try {
    const { userId } = userData;

    // Get sheet reference
    const profileSheet = getSheet('Profiles');

    // Delete from profiles
    const profileData = profileSheet.getDataRange().getValues();
    const profileHeaders = profileData[0];
    const profileIdIndex = profileHeaders.indexOf('ID');

    for (let i = 1; i < profileData.length; i++) {
      if (profileData[i][profileIdIndex] === userId) {
        profileSheet.deleteRow(i + 1);
        break;
      }
    }

    return createResponse({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleExportUsers(filters = {}) {
  try {
    const users = getSheetData('Profiles', filters);

    // Format for export
    const exportData = users.map(user => ({
      'ID': user.ID,
      'Email': user.Email,
      'Full Name': user['Full Name'],
      'Role': user['Role ID'] ? getRoleNameById(user['Role ID']) : 'staff',
      'Region': user.Region,
      'Service Center': user['Service Center'],
      'Active': user.Active,
      'Created At': user['Created At']
    }));

    return createResponse({
      success: true,
      data: exportData,
      count: exportData.length
    });
  } catch (error) {
    console.error('Error exporting users:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleGetActivities(filters = {}) {
  try {
    const activities = getSheetData('Complaint_History', filters);

    // Format activities for frontend
    const formattedActivities = activities.map(activity => ({
      id: activity.ID,
      action: activity.Action,
      userName: activity['User Name'] || 'Unknown',
      createdAt: activity['Created At'],
      ticketNumber: activity['Complaint ID'] ? `TKT-${activity['Complaint ID'].slice(-4)}` : null
    }));

    return createResponse({
      success: true,
      data: formattedActivities,
      count: formattedActivities.length
    });
  } catch (error) {
    console.error('Error getting activities:', error);
    return createResponse({ error: error.message }, 500);
  }
}

// ========== ATTACHMENT FUNCTIONS ==========

function handleGetAttachments(complaintId) {
  try {
    if (!complaintId) {
      throw new Error('Complaint ID is required');
    }

    const attachments = getSheetData('Complaint_Attachments', { 'Complaint ID': complaintId });

    // Format attachments for frontend
    const formattedAttachments = attachments.map(attachment => ({
      id: attachment.ID,
      complaintId: attachment['Complaint ID'],
      fileName: attachment['File Name'],
      filePath: attachment['File Path'],
      fileType: attachment['File Type'],
      fileSize: attachment['File Size'],
      uploadedBy: attachment['Uploaded By'],
      uploadedByName: attachment['Uploaded By'] || 'Unknown',
      createdAt: attachment['Uploaded At']
    }));

    return createResponse({
      success: true,
      data: formattedAttachments,
      count: formattedAttachments.length
    });
  } catch (error) {
    console.error('Error getting attachments:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleUploadAttachment(attachmentData) {
  try {
    const { complaintId, fileName, fileData, fileType, fileSize, uploadedBy, uploadedByName } = attachmentData;

    if (!complaintId || !fileName || !fileData) {
      throw new Error('Complaint ID, file name, and file data are required');
    }

    // Decode base64 file data
    const decodedData = Utilities.base64Decode(fileData);

    // Get or create Drive folder
    const folder = getOrCreateDriveFolder();

    // Create file in Drive
    const file = folder.createFile(Utilities.newBlob(decodedData, fileType, fileName));
    const fileId = file.getId();
    const fileUrl = file.getUrl();

    // Save attachment metadata to sheet
    const attachment = {
      'ID': generateId(),
      'Complaint ID': complaintId,
      'File Name': fileName,
      'File Path': fileUrl,
      'File Type': fileType,
      'File Size': fileSize || decodedData.length,
      'Uploaded By': uploadedBy || '',
      'Uploaded At': getCurrentTimestamp()
    };

    insertRecord('Complaint_Attachments', attachment);

    return createResponse({
      success: true,
      data: {
        id: attachment.ID,
        complaintId: attachment['Complaint ID'],
        fileName: attachment['File Name'],
        filePath: attachment['File Path'],
        fileType: attachment['File Type'],
        fileSize: attachment['File Size'],
        uploadedBy: attachment['Uploaded By'],
        uploadedByName: uploadedByName || 'Unknown',
        createdAt: attachment['Uploaded At']
      },
      message: 'Attachment uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleDownloadAttachment(attachmentId) {
  try {
    if (!attachmentId) {
      throw new Error('Attachment ID is required');
    }

    const attachments = getSheetData('Complaint_Attachments', { ID: attachmentId });
    if (attachments.length === 0) {
      throw new Error('Attachment not found');
    }

    const attachment = attachments[0];
    const fileUrl = attachment['File Path'];

    // Extract file ID from Google Drive URL
    const fileIdMatch = fileUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!fileIdMatch) {
      throw new Error('Invalid file URL');
    }

    const fileId = fileIdMatch[1];
    const file = DriveApp.getFileById(fileId);

    // Return file content
    const contentType = file.getMimeType();
    const fileName = file.getName();

    return ContentService
      .createTextOutput()
      .setMimeType(contentType)
      .append(file.getBlob().getBytes())
      .setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

  } catch (error) {
    console.error('Error downloading attachment:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleDeleteAttachment(attachmentId) {
  try {
    if (!attachmentId) {
      throw new Error('Attachment ID is required');
    }

    const attachments = getSheetData('Complaint_Attachments', { ID: attachmentId });
    if (attachments.length === 0) {
      throw new Error('Attachment not found');
    }

    const attachment = attachments[0];
    const fileUrl = attachment['File Path'];

    // Delete file from Drive
    try {
      const fileIdMatch = fileUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (fileIdMatch) {
        const fileId = fileIdMatch[1];
        DriveApp.getFileById(fileId).setTrashed(true);
      }
    } catch (driveError) {
      console.warn('Could not delete file from Drive:', driveError);
    }

    // Delete record from sheet
    const sheet = getSheet('Complaint_Attachments');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('ID');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === attachmentId) {
        sheet.deleteRow(i + 1);
        break;
      }
    }

    return createResponse({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function getOrCreateDriveFolder() {
  const folderId = CONFIG.DRIVE_FOLDER_ID;
  let folder;

  if (folderId) {
    try {
      folder = DriveApp.getFolderById(folderId);
    } catch (e) {
      console.log('Folder ID not found, creating new folder');
    }
  }

  if (!folder) {
    folder = DriveApp.createFolder('EEU Complaint Attachments');
    // Update the script properties with the new folder ID
    PropertiesService.getScriptProperties().setProperty('DRIVE_FOLDER_ID', folder.getId());
  }

  return folder;
}

function handleGetSystemSetting(data) {
  try {
    const { key } = validateRequired(data.key, 'Setting key');

    // Check cache first
    const cacheKey = `setting_${key}`;
    let cachedSetting = getCache(cacheKey);

    if (cachedSetting) {
      return createResponse({
        success: true,
        data: cachedSetting,
        cached: true
      });
    }

    const settings = getSheetData('System_Settings', { Key: key });

    if (settings.length === 0) {
      return createResponse({
        success: true,
        data: null,
        message: 'Setting not found'
      });
    }

    const setting = settings[0];
    const formattedSetting = {
      id: setting.ID,
      key: setting.Key,
      value: setting.Value,
      updated_at: setting['Updated At'],
      updated_by: setting['Updated By']
    };

    // Cache the result
    setCache(cacheKey, formattedSetting);

    return createResponse({
      success: true,
      data: formattedSetting,
      cached: false
    });
  } catch (error) {
    console.error('Error getting system setting:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleGetAllSettings(data) {
  try {
    const allSettings = {};

    // Get General Settings
    const generalSettings = getSheetData('General_Settings');
    generalSettings.forEach(setting => {
      allSettings[setting.Key] = setting.Value;
    });

    // Get Email Settings
    const emailSettings = getSheetData('Email_Settings');
    emailSettings.forEach(setting => {
      allSettings[setting.Key] = setting.Value === 'true' ? true : setting.Value === 'false' ? false : setting.Value;
    });

    // Get Notification Settings
    const notificationSettings = getSheetData('Notification_Settings');
    notificationSettings.forEach(setting => {
      allSettings[setting.Key] = setting.Value === 'true' ? true : setting.Value === 'false' ? false : setting.Value;
    });

    // Get Security Settings
    const securitySettings = getSheetData('Security_Settings');
    securitySettings.forEach(setting => {
      allSettings[setting.Key] = setting.Value;
    });

    // Get Data Settings
    const dataSettings = getSheetData('Data_Settings');
    dataSettings.forEach(setting => {
      allSettings[setting.Key] = setting.Value === 'true' ? true : setting.Value === 'false' ? false : setting.Value;
    });

    return createResponse({
      success: true,
      data: allSettings
    });
  } catch (error) {
    console.error('Error getting all settings:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleUpdateSettings(data) {
  try {
    const { settings, updated_by } = data;

    if (!settings || typeof settings !== 'object') {
      throw new Error('Settings data is required');
    }

    let totalUpdated = 0;

    // Update General Settings
    const generalKeys = ['system_name', 'timezone', 'language', 'date_format'];
    generalKeys.forEach(key => {
      if (settings[key] !== undefined) {
        updateOrInsertSetting('General_Settings', key, settings[key], updated_by);
        totalUpdated++;
      }
    });

    // Update Email Settings
    const emailKeys = ['email_enabled', 'email_host', 'email_port', 'email_username', 'email_from'];
    emailKeys.forEach(key => {
      if (settings[key] !== undefined) {
        updateOrInsertSetting('Email_Settings', key, settings[key], updated_by);
        totalUpdated++;
      }
    });

    // Update Notification Settings
    const notificationKeys = ['notify_on_new_complaint', 'notify_on_assignment', 'notify_on_status_change', 'notify_on_resolution', 'auto_assignment', 'assign_by_region', 'assign_by_workload'];
    notificationKeys.forEach(key => {
      if (settings[key] !== undefined) {
        updateOrInsertSetting('Notification_Settings', key, settings[key], updated_by);
        totalUpdated++;
      }
    });

    // Update Security Settings
    const securityKeys = ['session_timeout', 'password_expiry', 'max_login_attempts', 'two_factor_enabled'];
    securityKeys.forEach(key => {
      if (settings[key] !== undefined) {
        updateOrInsertSetting('Security_Settings', key, settings[key], updated_by);
        totalUpdated++;
      }
    });

    // Update Data Settings
    const dataKeys = ['archive_after_days', 'delete_after_days', 'backup_enabled', 'backup_frequency'];
    dataKeys.forEach(key => {
      if (settings[key] !== undefined) {
        updateOrInsertSetting('Data_Settings', key, settings[key], updated_by);
        totalUpdated++;
      }
    });

    // Clear all settings cache
    clearCache('all_settings');

    logActivity('SETTINGS_UPDATED', updated_by || 'system', '', {
      updatedSettings: totalUpdated
    });

    return createResponse({
      success: true,
      message: `Settings updated successfully. ${totalUpdated} settings updated.`
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function updateOrInsertSetting(sheetName, key, value, updatedBy) {
  try {
    const existingSettings = getSheetData(sheetName, { Key: key });

    if (existingSettings.length > 0) {
      // Update existing setting
      const existing = existingSettings[0];
      updateRecord(sheetName, {
        'ID': existing.ID,
        'Key': key,
        'Value': String(value),
        'Updated At': getCurrentTimestamp(),
        'Updated By': updatedBy || 'system'
      });
    } else {
      // Create new setting
      insertRecord(sheetName, {
        'ID': generateId(),
        'Key': key,
        'Value': String(value),
        'Updated At': getCurrentTimestamp(),
        'Updated By': updatedBy || 'system'
      });
    }
  } catch (error) {
    console.error(`Error updating setting ${key} in ${sheetName}:`, error);
    throw error;
  }
}

function handleUpdateSystemSetting(data) {
  try {
    const key = validateRequired(data.key, 'Setting key');
    const value = validateRequired(data.value, 'Setting value');

    // Clear cache for this setting
    clearCache(`setting_${key}`);

    // Check if setting exists
    const existingSettings = getSheetData('System_Settings', { Key: key });

    if (existingSettings.length > 0) {
      // Update existing setting
      const existing = existingSettings[0];
      updateRecord('System_Settings', {
        'ID': existing.ID,
        'Key': key,
        'Value': value,
        'Updated At': data.updated_at || getCurrentTimestamp(),
        'Updated By': data.updated_by || 'system'
      });
    } else {
      // Create new setting
      insertRecord('System_Settings', {
        'ID': generateId(),
        'Key': key,
        'Value': value,
        'Updated At': data.updated_at || getCurrentTimestamp(),
        'Updated By': data.updated_by || 'system'
      });
    }

    logActivity('SETTING_UPDATED', data.updated_by || 'system', '', {
      key: key,
      oldValue: existingSettings.length > 0 ? existingSettings[0].Value : null,
      newValue: value
    });

    return createResponse({
      success: true,
      message: 'System setting updated successfully'
    });
  } catch (error) {
    console.error('Error updating system setting:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleGetPermissions(data) {
  try {
    // Get all roles
    const roles = getSheetData('Roles');

    // Get all permissions
    const permissions = getSheetData('Role_Permissions');

    // Group permissions by role
    const rolePermissions = {};

    roles.forEach(role => {
      const rolePerms = permissions.filter(p => p['Role ID'] === role.ID);
      rolePermissions[role.Name] = rolePerms.map(p => ({
        resource: p.Resource,
        view: p.View === true || String(p.View).toLowerCase() === 'true',
        create: p.Create === true || String(p.Create).toLowerCase() === 'true',
        edit: p.Edit === true || String(p.Edit).toLowerCase() === 'true',
        delete: p.Delete === true || String(p.Delete).toLowerCase() === 'true'
      }));
    });

    return createResponse({
      success: true,
      data: rolePermissions
    });
  } catch (error) {
    console.error('Error getting permissions:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function handleUpdatePermissions(data) {
  try {
    const { permissions, updated_by } = data;

    if (!permissions || typeof permissions !== 'object') {
      throw new Error('Permissions data is required');
    }

    // Get all roles to map role names to IDs
    const roles = getSheetData('Roles');
    const roleMap = {};
    roles.forEach(role => {
      roleMap[role.Name] = role.ID;
    });

    // Clear existing permissions
    const permissionsSheet = getSheet('Role_Permissions');
    const existingPermissions = permissionsSheet.getDataRange().getValues();
    if (existingPermissions.length > 1) {
      permissionsSheet.getRange(2, 1, existingPermissions.length - 1, existingPermissions[0].length).clearContent();
    }

    // Insert new permissions
    let insertedCount = 0;
    Object.keys(permissions).forEach(roleName => {
      const roleId = roleMap[roleName];
      if (!roleId) {
        console.warn(`Role ${roleName} not found, skipping`);
        return;
      }

      permissions[roleName].forEach(perm => {
        const permissionRecord = {
          'ID': generateId(),
          'Role ID': roleId,
          'Resource': perm.resource,
          'View': perm.view,
          'Create': perm.create,
          'Edit': perm.edit,
          'Delete': perm.delete,
          'Created At': getCurrentTimestamp(),
          'Updated At': getCurrentTimestamp()
        };

        insertRecord('Role_Permissions', permissionRecord);
        insertedCount++;
      });
    });

    logActivity('PERMISSIONS_UPDATED', updated_by || 'system', '', {
      updatedPermissions: insertedCount
    });

    return createResponse({
      success: true,
      message: `Permissions updated successfully. ${insertedCount} permission records created.`
    });
  } catch (error) {
    console.error('Error updating permissions:', error);
    return createResponse({ error: error.message }, 500);
  }
}

function createResponse(data, statusCode = 200) {
  const response = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);

  // CORS headers are handled by the proxy server, not GAS directly
  // GAS setHeader() method is not available in all environments

  return response;
}

// ========== DEPLOYMENT FUNCTIONS ==========

function testConnection() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheets = ss.getSheets();
    const sheetNames = sheets.map(sheet => sheet.getName());
    
    return {
      success: true,
      message: 'Successfully connected to Google Sheet',
      sheetCount: sheets.length,
      sheetNames: sheetNames,
      timestamp: getCurrentTimestamp()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: getCurrentTimestamp()
    };
  }
}

function initializeWithSeedData() {
  const result = seedAllData();
  return result;
}

// Create menu for easy access
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('⚡ EEU System')
    .addItem('Initialize Sheets', 'initializeSheets')
    .addItem('Seed Data', 'seedAllData')
    .addItem('Clear All Data', 'clearAllDataWithConfirmation')
    .addItem('Test Connection', 'testConnection')
    .addSeparator()
    .addItem('Create Backup', 'createManualBackup')
    .addItem('System Health Check', 'showSystemHealth')
    .addItem('Data Integrity Check', 'showDataIntegrity')
    .addItem('Clear Cache', 'clearAllCache')
    .addSeparator()
    .addItem('View Recent Logs', 'showRecentLogs')
    .addToUi();
}

// Menu action functions
function createManualBackup() {
  const result = createBackup('manual');
  if (result.success) {
    SpreadsheetApp.getUi().alert('Backup created successfully!\n\nFolder: ' + result.backupFolderId);
  } else {
    SpreadsheetApp.getUi().alert('Backup failed: ' + result.error);
  }
}

function showSystemHealth() {
  const health = runSystemHealthCheck();
  const message = `System Health: ${health.overallHealth.toUpperCase()}\n\n` +
    `Version: ${health.version}\n` +
    `Sheets: ${health.checks.sheetConnectivity.sheetCount || 'N/A'}\n` +
    `Cache Entries: ${health.checks.cacheStatus.cacheEntries}\n` +
    `Unhealthy Checks: ${health.unhealthyChecks}`;

  SpreadsheetApp.getUi().alert(message);
}

function showDataIntegrity() {
  const integrity = validateDataIntegrity();
  const message = `Data Integrity: ${integrity.integrityStatus.toUpperCase()}\n\n` +
    `Profiles with Invalid Roles: ${integrity.userRoleIntegrity.profilesWithInvalidRoles}\n` +
    `Profiles without Roles: ${integrity.userRoleIntegrity.profilesWithoutRoles}\n` +
    `Invalid Complaints: ${integrity.complaintIntegrity.invalidComplaints}\n` +
    `Orphaned Permissions: ${integrity.rolePermissionIntegrity.orphanedPermissions}\n` +
    `Roles without Permissions: ${integrity.rolePermissionIntegrity.rolesWithoutPermissions}\n` +
    `Missing Sheets: ${integrity.sheetStructure.missingSheets.join(', ') || 'None'}`;

  SpreadsheetApp.getUi().alert(message);
}

function showRecentLogs() {
  const logs = getActivityLogs({}, 10);
  if (logs.length === 0) {
    SpreadsheetApp.getUi().alert('No recent logs found.');
    return;
  }

  let message = 'Recent Activity Logs:\n\n';
  logs.forEach(log => {
    message += `${new Date(log.Timestamp).toLocaleString()}: ${log.Action} by ${log['User Email'] || 'System'}\n`;
  });

  SpreadsheetApp.getUi().alert(message);
}

function clearAllDataWithConfirmation() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    '⚠️ Clear All Data',
    'This will permanently delete ALL data from the database (except system logs).\n\n' +
    'This action CANNOT be undone. Make sure you have a backup!\n\n' +
    'Are you sure you want to continue?',
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    const result = clearAllData();

    if (result.success) {
      ui.alert('✅ Database Cleared Successfully',
        `Removed ${result.details.totalRowsCleared} rows from ${result.details.clearedSheets} sheets.\n\n` +
        'The database has been reset to empty state (headers preserved).'
      );
    } else {
      ui.alert('❌ Clear Data Failed', 'Error: ' + result.error);
    }
  }
}

// Quick test function
function quickTest() {
  console.log('Running quick test...');
  
  // Test connection
  const connectionTest = testConnection();
  console.log('Connection test:', connectionTest);
  
  // Initialize sheets
  const initResult = initializeSheets();
  console.log('Sheets initialization:', initResult);
  
  // Seed minimal data
  const seedResult = seedAllData();
  console.log('Seed data result:', seedResult);
  
  return {
    connection: connectionTest,
    initialization: initResult,
    seeding: seedResult
  };
}