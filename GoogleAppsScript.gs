// --- CONFIGURATION / DATABASE ---

var EMPLOYEES = {
  'kaycee@vitalitykauai.com': { name: 'Kaycee Milne', category: 'OM', rate: 32, pin: '1234' },
  'hudson.malloryayn@gmail.com': { name: 'Mallory Hudson', category: 'INJ', rate: 55, pin: '1234' },
  'chayil@vitalitykauai.com': { name: 'Chayil Christensen', category: 'LS', rate: 38.5, pin: '1234' },
  'becca.day.reed@gmail.com': { name: 'Becca Reed', category: 'WN', rate: 50, pin: '1234' },
  'tpaulsen75@gmail.com': { name: 'Tasha Paulsen', category: 'WN', rate: 50, pin: '1234' },
  'BeingNova@pm.me': { name: 'Nova Roberts', category: 'WN', rate: 50, pin: '1234' },
  'andrianna4@icloud.com': { name: 'Andrianna Mendiville', category: 'WN', rate: 50, pin: '1234' },
  'ikdilley@gmail.com': { name: 'Isaac Dilley', category: 'WN', rate: 50, pin: '1234' },
  'ogdilley@gmail.com': { name: 'Olivia Dilley', category: 'LS', rate: 38.5, pin: '1234' },
  'btdilley@gmail.com': { name: 'Brian Dilley', category: 'WN', rate: 50, pin: '1234' },
  'lafer006@gmail.com': { name: 'Bri LaFerriere', category: 'OM', rate: 30, pin: '1234' }
};

var PROCEDURES = {
  // OM
  'OM_PhoneDay': { name: 'Phone Day', value: 50, category: 'OM' },
  
  // INJ
  'INJ_Botox': { name: 'Botox', value: 25, category: 'INJ' },
  'INJ_Microneedling': { name: 'Microneedling', value: 50, category: 'INJ' },
  'INJ_NanoNeedling': { name: 'Nano-needling', value: 25, category: 'INJ' },
  'INJ_Exesomes': { name: 'Exesomes', value: 15, category: 'INJ' },
  
  // WN
  'WN_IV': { name: 'IV', value: 35, category: 'WN' },
  'WN_Microneedling': { name: 'Microneedling', value: 35, category: 'WN' },
  'WN_Glutathione': { name: 'Glutathione', value: 20, category: 'WN' },
  'WN_PhoneDay': { name: 'Phone Day', value: 50, category: 'WN' },
  'WN_NanoNeedling': { name: 'Nano-needling', value: 25, category: 'WN' },
  'WN_Exesomes': { name: 'Exesomes', value: 15, category: 'WN' },
  
  // LS
  'LS_SmallLHR': { name: 'Small LHR', value: 15, category: 'LS' },
  'LS_MediumLHR': { name: 'Medium LHR', value: 22.5, category: 'LS' },
  'LS_LargeLHR': { name: 'Large LHR', value: 30, category: 'LS' },
  'LS_XLargeLHR': { name: 'XLarge LHR', value: 45, category: 'LS' },
  'LS_BBL': { name: 'BBL', value: 25, category: 'LS' },
  'LS_Halo': { name: 'Halo', value: 50, category: 'LS' },
  'LS_VL': { name: 'VL', value: 15, category: 'LS' },
  'LS_PL': { name: 'PL', value: 15, category: 'LS' },
  'LS_SF': { name: 'SF', value: 15, category: 'LS' },
  'LS_CP': { name: 'CP', value: 22.5, category: 'LS' },
  'LS_Laundry': { name: 'Laundry', value: 22.5, category: 'LS' },
  'LS_Numbing': { name: 'Numbing', value: 7.5, category: 'LS' },
  'LS_PhoneDay': { name: 'Phone Day', value: 50, category: 'LS' },
  'LS_NanoNeedling': { name: 'Nano-needling', value: 25, category: 'LS' },
  'LS_Exesomes': { name: 'Exesomes', value: 15, category: 'LS' }
};

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 10 seconds for concurrent access
  lock.tryLock(10000); 

  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var action = data.action;

    // --- HANDLE LOGIN ---
    if (action === 'login') {
      var email = data.email ? data.email.trim() : '';
      var pin = data.pin ? data.pin.trim() : '';
      
      var employee = EMPLOYEES[email];
      
      if (employee && employee.pin === pin) {
        // Return success with employee details (excluding PIN) and the procedure list
        var safeEmployee = {
          name: employee.name,
          category: employee.category,
          rate: employee.rate
        };
        
        return ContentService.createTextOutput(JSON.stringify({ 
          'result': 'success',
          'employee': safeEmployee,
          'procedures': PROCEDURES 
        })).setMimeType(ContentService.MimeType.JSON);
        
      } else {
        return ContentService.createTextOutput(JSON.stringify({ 
          'result': 'error', 
          'error': 'Invalid email or PIN' 
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // --- HANDLE DELETE SHIFT ---
    if (action === 'deleteShift') {
      var dateForDelete = new Date(data.clockIn || data.clockOut || new Date());
      if (isNaN(dateForDelete.getTime())) dateForDelete = new Date();
      var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      var monthStr = monthNames[dateForDelete.getMonth()];
      var yearStr = dateForDelete.getFullYear();
      var fileName = monthStr + ", " + yearStr + " Payroll";

      var doc = null;
      try {
        var iterator = DriveApp.getFilesByName(fileName);
        if (iterator.hasNext()) {
          doc = SpreadsheetApp.open(iterator.next());
        }
      } catch (e) {
        // Ignore, fallback to active below
      }

      if (!doc) {
        doc = SpreadsheetApp.getActiveSpreadsheet();
      }

      var sheets = doc.getSheets();
      
      for (var s = 0; s < sheets.length; s++) {
        var sheet = sheets[s];
        var dataRange = sheet.getDataRange();
        var sheetValues = dataRange.getValues();
        
        if (sheetValues.length > 0) {
          var headers = sheetValues[0];
          var empNameIdx = headers.indexOf('Employee Name');
          var clockInIdx = headers.indexOf('Clock In');
          var clockOutIdx = headers.indexOf('Clock Out');
          
          if (clockInIdx >= 0 && clockOutIdx >= 0) {
            // Traverse from bottom up to safely delete rows
            for (var r = sheetValues.length - 1; r > 0; r--) {
              var rowMatch = true;
              
              if (empNameIdx >= 0 && sheetValues[r][empNameIdx] !== data.employeeName) {
                rowMatch = false;
              }
              if (sheetValues[r][clockInIdx] !== data.clockIn) {
                rowMatch = false;
              }
              // Optional: match clockOut to be extra safe
              if (data.clockOut && sheetValues[r][clockOutIdx] !== data.clockOut) {
                rowMatch = false;
              }
              
              if (rowMatch) {
                sheet.deleteRow(r + 1); // +1 because array is 0-indexed and rows are 1-indexed
              }
            }
          }
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ 'result': 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --- HANDLE CLOCK OUT (DEFAULT) ---
    var date = new Date(data.clockOut || data.clockIn);
    if (isNaN(date.getTime())) date = new Date(); // fallback
    
    var year = date.getFullYear();
    var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var month = monthNames[date.getMonth()];
    var day = date.getDate();
    
    var periodName = month + " " + year + " " + (day <= 15 ? "(1st-15th)" : "(16th-End)");
    var fileName = month + ", " + year + " Payroll";

    var doc = null;
    try {
      var iterator = DriveApp.getFilesByName(fileName);
      if (iterator.hasNext()) {
        doc = SpreadsheetApp.open(iterator.next());
      } else {
        doc = SpreadsheetApp.create(fileName);
        try {
          var activeFile = DriveApp.getFileById(SpreadsheetApp.getActiveSpreadsheet().getId());
          var parents = activeFile.getParents();
          if (parents.hasNext()) {
            var folder = parents.next();
            DriveApp.getFileById(doc.getId()).moveTo(folder);
          }
        } catch (e) {
          // Ignore
        }
        
        // Remove default 'Sheet1' later if we inserted new ones
      }
    } catch(e) {
      doc = SpreadsheetApp.getActiveSpreadsheet(); // Fallback if DriveApp is unauthorized
    }

    // Define procValueMap to lookup procedure values
    var procValueMap = {};
    for (var pKey in PROCEDURES) {
      if (PROCEDURES.hasOwnProperty(pKey)) {
        var p = PROCEDURES[pKey];
        var headerName = p.name + " [" + p.category + "]";
        procValueMap[headerName] = p.value;
      }
    }

    // Find the employee's rate
    var empRate = 0;
    var emails = Object.keys(EMPLOYEES);
    for (var i = 0; i < emails.length; i++) {
      if (EMPLOYEES[emails[i]].name === data.employeeName) {
        empRate = EMPLOYEES[emails[i]].rate;
        break;
      }
    }

    // Helper to get Excel-style column letters from 0-based index
    function getColLetter(colIdx) {
      var temp, letter = '';
      var col = colIdx + 1;
      while (col > 0) {
        temp = (col - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        col = (col - temp - 1) / 26;
      }
      return letter;
    }

    // Function to log data to a specific sheet
    function logToSheet(sheetName, isMaster) {
      var sheet = doc.getSheetByName(sheetName);
      if (!sheet) {
        sheet = doc.insertSheet(sheetName);
        var baseHeaders = isMaster 
          ? ['Timestamp', 'Employee Name', 'Category', 'Clock In', 'Clock Out', 'Total Hours', 'Hourly Pay', 'Bonus Pay', 'Total Pay', 'Location In', 'Location Out', 'Reason']
          : ['Timestamp', 'Category', 'Clock In', 'Clock Out', 'Total Hours', 'Hourly Pay', 'Bonus Pay', 'Total Pay', 'Location In', 'Location Out', 'Reason'];
        sheet.appendRow(baseHeaders);
        sheet.getRange(1, 1, 1, baseHeaders.length).setFontWeight('bold');
      }

      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      
      var clockInIdx = headers.indexOf('Clock In');
      var clockOutIdx = headers.indexOf('Clock Out');
      var totalHoursIdx = headers.indexOf('Total Hours');
      var hourlyPayIdx = headers.indexOf('Hourly Pay');
      var bonusPayIdx = headers.indexOf('Bonus Pay');
      var totalPayIdx = headers.indexOf('Total Pay');

      var rowData = {
        'Timestamp': new Date(),
        'Employee Name': data.employeeName,
        'Category': data.category,
        'Clock In': data.clockIn,
        'Clock Out': data.clockOut,
        'Total Hours': '', // Will be filled with formula
        'Hourly Pay': '',  // Will be filled with formula
        'Bonus Pay': '',   // Will be filled with formula
        'Total Pay': '',   // Will be filled with formula
        'Location In': data.locationIn,
        'Location Out': data.locationOut,
        'Reason': data.reason || ''
      };

      var standardKeys = ['action', 'employeeName', 'category', 'clockIn', 'clockOut', 'totalHours', 'locationIn', 'locationOut', 'procedures', 'hourlyPay', 'bonusPay', 'totalPay', 'reason'];
      
      for (var key in data) {
        if (standardKeys.indexOf(key) === -1) {
          if (headers.indexOf(key) === -1) {
            sheet.getRange(1, headers.length + 1).setValue(key);
            headers.push(key);
          }
          rowData[key] = data[key];
        }
      }

      var newRow = headers.map(function(header) {
        return rowData[header] || '';
      });

      sheet.appendRow(newRow);
      var r = sheet.getLastRow();

      // Write formulas for calculations
      if (clockInIdx >= 0 && clockOutIdx >= 0 && totalHoursIdx >= 0) {
        var cInL = getColLetter(clockInIdx);
        var cOutL = getColLetter(clockOutIdx);
        var tHoursRange = sheet.getRange(r, totalHoursIdx + 1);
        tHoursRange.setFormula('=IF(OR(ISBLANK(' + cInL + r + '), ISBLANK(' + cOutL + r + ')), 0, MOD(' + cOutL + r + '-' + cInL + r + ', 1)*24)');
        tHoursRange.setNumberFormat('0.00');
      }

      if (totalHoursIdx >= 0 && hourlyPayIdx >= 0) {
        var tHoursL = getColLetter(totalHoursIdx);
        var hPayRange = sheet.getRange(r, hourlyPayIdx + 1);
        hPayRange.setFormula('=' + tHoursL + r + ' * ' + empRate);
        hPayRange.setNumberFormat('"$"#,##0.00');
      }

      if (bonusPayIdx >= 0) {
        var bonusTerms = [];
        for (var i = 0; i < headers.length; i++) {
          var hName = headers[i];
          if (procValueMap[hName] !== undefined) {
            bonusTerms.push('IFERROR(' + getColLetter(i) + r + ' * ' + procValueMap[hName] + ', 0)');
          }
        }
        var bonusFormula = bonusTerms.length > 0 ? '=' + bonusTerms.join(' + ') : '=0';
        var bPayRange = sheet.getRange(r, bonusPayIdx + 1);
        bPayRange.setFormula(bonusFormula);
        bPayRange.setNumberFormat('"$"#,##0.00');
      }

      if (hourlyPayIdx >= 0 && bonusPayIdx >= 0 && totalPayIdx >= 0) {
        var hPayL = getColLetter(hourlyPayIdx);
        var bPayL = getColLetter(bonusPayIdx);
        var tPayRange = sheet.getRange(r, totalPayIdx + 1);
        tPayRange.setFormula('=' + hPayL + r + ' + ' + bPayL + r);
        tPayRange.setNumberFormat('"$"#,##0.00');
      }
    }

    // Log to Master sheet specific to the Pay Period
    logToSheet('Master ' + periodName, true);
    
    // Log to Individual sheet specific to the Pay Period
    if (data.employeeName) {
      logToSheet(data.employeeName + ' ' + periodName, false);
    }

    var monthName = month + " " + year + " (Full Month)";

    // Log to Master sheet for the entire month
    logToSheet('Master ' + monthName, true);

    // Log to Individual sheet for the entire month
    if (data.employeeName) {
      logToSheet(data.employeeName + ' ' + monthName, false);
    }

    // Remove default "Sheet1" if it was created by SpreadsheetApp.create()
    try {
      var sheet1 = doc.getSheetByName('Sheet1');
      if (sheet1 && doc.getSheets().length > 1) {
        doc.deleteSheet(sheet1);
      }
    } catch(e) {}

    return ContentService.createTextOutput(JSON.stringify({ 'result': 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}


