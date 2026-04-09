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

    // --- HANDLE CLOCK OUT (DEFAULT) ---
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    
    // Function to log data to a specific sheet
    function logToSheet(sheetName, isMaster) {
      var sheet = doc.getSheetByName(sheetName);
      if (!sheet) {
        sheet = doc.insertSheet(sheetName);
        var baseHeaders = isMaster 
          ? ['Timestamp', 'Employee Name', 'Category', 'Clock In', 'Clock Out', 'Total Hours', 'Hourly Pay', 'Bonus Pay', 'Total Pay', 'Location In', 'Location Out']
          : ['Timestamp', 'Category', 'Clock In', 'Clock Out', 'Total Hours', 'Hourly Pay', 'Bonus Pay', 'Total Pay', 'Location In', 'Location Out'];
        sheet.appendRow(baseHeaders);
        sheet.getRange(1, 1, 1, baseHeaders.length).setFontWeight('bold');
      }

      var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var rowData = {
        'Timestamp': new Date(),
        'Employee Name': data.employeeName,
        'Category': data.category,
        'Clock In': data.clockIn,
        'Clock Out': data.clockOut,
        'Total Hours': data.totalHours,
        'Hourly Pay': data.hourlyPay,
        'Bonus Pay': data.bonusPay,
        'Total Pay': data.totalPay,
        'Location In': data.locationIn,
        'Location Out': data.locationOut
      };

      var standardKeys = ['action', 'employeeName', 'category', 'clockIn', 'clockOut', 'totalHours', 'locationIn', 'locationOut', 'procedures', 'hourlyPay', 'bonusPay', 'totalPay'];
      
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
    }

    // Log to Master sheet
    logToSheet('TimeLog', true);
    
    // Log to Individual sheet
    if (data.employeeName) {
      logToSheet(data.employeeName, false);
    }

    return ContentService.createTextOutput(JSON.stringify({ 'result': 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ 'result': 'error', 'error': e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Creates a menu in the spreadsheet to manage the summary sheet.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Time Sheet Admin')
      .addItem('Setup/Update Summary Sheet', 'setupSummarySheet')
      .addToUi();
}

/**
 * Sets up or updates the Summary sheet with formulas linking to individual employee sheets.
 */
function setupSummarySheet() {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = doc.getSheetByName('Summary');
  if (!sheet) {
    sheet = doc.insertSheet('Summary', 0);
  }
  
  sheet.clear();
  
  // Setup Month/Year selector
  var now = new Date();
  sheet.getRange('A1').setValue('Year:').setFontWeight('bold');
  sheet.getRange('B1').setValue(now.getFullYear());
  sheet.getRange('C1').setValue('Month:').setFontWeight('bold');
  sheet.getRange('D1').setValue(now.getMonth() + 1);
  
  var headers = ['Employee', '1st - 15th Pay', '16th - End Pay', 'Total Monthly Pay'];
  sheet.getRange(3, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#f3f4f6');
  
  var emails = Object.keys(EMPLOYEES);
  var row = 4;
  
  for (var i = 0; i < emails.length; i++) {
    var emp = EMPLOYEES[emails[i]];
    var name = emp.name;
    
    // Ensure individual sheet exists for formulas to work
    var empSheet = doc.getSheetByName(name);
    if (!empSheet) {
      empSheet = doc.insertSheet(name);
      empSheet.appendRow(['Timestamp', 'Category', 'Clock In', 'Clock Out', 'Total Hours', 'Hourly Pay', 'Bonus Pay', 'Total Pay', 'Location In', 'Location Out']);
      empSheet.getRange(1, 1, 1, 10).setFontWeight('bold');
    }
    
    sheet.getRange(row, 1).setValue(name);
    
    var yearRef = '$B$1';
    var monthRef = '$D$1';
    
    // 1st-15th (Col H is Total Pay in individual sheets)
    var formula1 = '=SUMIFS(\'' + name + '\'!H:H, \'' + name + '\'!A:A, ">="&DATE(' + yearRef + ', ' + monthRef + ', 1), \'' + name + '\'!A:A, "<="&DATE(' + yearRef + ', ' + monthRef + ', 15))';
    sheet.getRange(row, 2).setFormula(formula1);
    
    // 16th-End
    var formula2 = '=SUMIFS(\'' + name + '\'!H:H, \'' + name + '\'!A:A, ">="&DATE(' + yearRef + ', ' + monthRef + ', 16), \'' + name + '\'!A:A, "<="&EOMONTH(DATE(' + yearRef + ', ' + monthRef + ', 1), 0))';
    sheet.getRange(row, 3).setFormula(formula2);
    
    // Total
    var formula3 = '=B' + row + ' + C' + row;
    sheet.getRange(row, 4).setFormula(formula3);
    
    row++;
  }
  
  // Add Grand Total row
  sheet.getRange(row, 1).setValue('GRAND TOTAL').setFontWeight('bold');
  sheet.getRange(row, 2).setFormula('=SUM(B4:B' + (row-1) + ')').setFontWeight('bold');
  sheet.getRange(row, 3).setFormula('=SUM(C4:C' + (row-1) + ')').setFontWeight('bold');
  sheet.getRange(row, 4).setFormula('=SUM(D4:D' + (row-1) + ')').setFontWeight('bold');
  
  // Formatting
  sheet.getRange(4, 2, row - 3, 3).setNumberFormat('$#,##0.00');
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 120);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 150);
  
  // Add some borders
  sheet.getRange(3, 1, row - 2, 4).setBorder(true, true, true, true, true, true);
}
