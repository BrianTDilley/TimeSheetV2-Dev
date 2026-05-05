// --- CONFIGURATION / DATABASE ---

var EMPLOYEES = {
  'kaycee@vitalitykauai.com': { name: 'Kaycee Milne', category: 'OM', rate: 32, pin: '1234' },
  'hudson.malloryayn@gmail.com': { name: 'Mallory Hudson', category: 'INJ', rate: 55, pin: '1234' },
  'chayil@vitalitykauai.com': { name: 'Chayil Christensen', category: 'LS', rate: 38.5, pin: '1234' },
  'becca.day.reed@gmail.com': { name: 'Becca Reed', category: 'WN', rate: 55, pin: '1234' },
  'tpaulsen75@gmail.com': { name: 'Tasha Paulsen', category: 'WN', rate: 55, pin: '1234' },
  'beingnova@pm.me': { name: 'Nova Roberts', category: 'WN', rate: 55, pin: '1234' },
  'andrianna4@icloud.com': { name: 'Andrianna Mendiville', category: 'WN', rate: 55, pin: '1234' },
  'ikdilley@gmail.com': { name: 'Isaac Dilley', category: 'WN', rate: 55, pin: '1234' },
  'ogdilley@gmail.com': { name: 'Olivia Dilley', category: 'LS', rate: 38.5, pin: '1234' },
  'btdilley@gmail.com': { name: 'Brian Dilley', category: 'WN', rate: 55, pin: '1234' },
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
  'WN_GSHAddOn': { name: 'GSH Add-on', value: 10, category: 'WN' },
  'WN_Microneedling': { name: 'Microneedling', value: 50, category: 'WN' },
  'WN_Glutathione': { name: 'Glutathione', value: 20, category: 'WN' },
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
      var email = data.email ? data.email.trim().toLowerCase() : '';
      var pin = data.pin ? data.pin.trim() : '';
      
      var employeeKey = Object.keys(EMPLOYEES).find(function(k) {
        return k.toLowerCase() === email;
      });
      var employee = employeeKey ? EMPLOYEES[employeeKey] : null;
      
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
      var dateForDelete = new Date(data.deleteDate || data.clockIn || data.clockOut || new Date());
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
        var displayValues = dataRange.getDisplayValues();
        
        if (sheetValues.length > 0) {
          var headers = sheetValues[0];
          var empNameIdx = headers.indexOf('Employee Name');
          var clockInIdx = headers.indexOf('Clock In');
          var clockOutIdx = headers.indexOf('Clock Out');
          
          if (clockInIdx >= 0 && clockOutIdx >= 0) {
            // Traverse from bottom up to safely delete rows
            for (var r = sheetValues.length - 1; r > 0; r--) {
              var rowMatch = true;
              
              if (empNameIdx >= 0 && displayValues[r][empNameIdx] !== data.employeeName) {
                rowMatch = false;
              }
              
              // Helper to normalize time strings (e.g. "03:15:00 PM" vs "3:15:00 PM", strip seconds)
              var normalizeTime = function(t) {
                var str = (t || '').toString().trim().toLowerCase();
                str = str.replace(/^0/, '');
                str = str.replace(/\s+(am|pm)/, '$1');
                str = str.replace(/:(\d{2}):\d{2}(am|pm)/, ':$1$2'); // strip seconds
                return str;
              };

              if (normalizeTime(displayValues[r][clockInIdx]) !== normalizeTime(data.clockIn)) {
                rowMatch = false;
              }
              // Optional: match clockOut to be extra safe
              if (data.clockOut && normalizeTime(displayValues[r][clockOutIdx]) !== normalizeTime(data.clockOut)) {
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

    // --- MIGRATION & REORGANIZATION ---
    try {
      var existingSheets = doc.getSheets();
      existingSheets.forEach(function(s) {
        var nm = s.getName();
        // Use regex to match old patterns
        var newName = null;
        var m = nm.match(/^Master (.*) \((1st-15th|16th-End|Full Month)\)$/);
        if (m) {
          newName = m[2] + " Master";
        } else {
          var indivMatch = nm.match(/^([A-Za-z]+)\s+.*? \((1st-15th|16th-End|Full Month)\)$/);
          if (indivMatch) {
             newName = indivMatch[2] + " " + indivMatch[1];
          }
        }
        
        if (newName && !doc.getSheetByName(newName)) {
          s.setName(newName);
        }
      });

      // Re-fetch sheets after rename to process columns
      existingSheets = doc.getSheets();
      existingSheets.forEach(function(s) {
          if (s.getLastColumn() > 0 && s.getLastRow() > 0) {
            var headersRange = s.getRange(1, 1, 1, s.getLastColumn());
            var headers = headersRange.getValues()[0];
            
            if (headers[0] === 'Timestamp') {
              // It's the old format!
              
              // 1. Insert 'Date' at 1
              s.insertColumnBefore(1);
              s.getRange(1, 1).setValue('Date');
              
              headers = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0];
              var clInIdx = headers.indexOf('Clock In');
              if (clInIdx > -1) {
                var dRange = s.getDataRange();
                var dVals = dRange.getValues();
                var nd = [];
                for (var rx = 0; rx < dVals.length; rx++) {
                  if (rx === 0) nd.push(['Date']);
                  else {
                    var cInVal = dVals[rx][clInIdx];
                    if (cInVal) {
                      var dObj = new Date(cInVal);
                      if (!isNaN(dObj.getTime())) {
                        nd.push([(dObj.getMonth()+1)+"/"+dObj.getDate()+"/"+dObj.getFullYear()]);
                      } else nd.push(['']);
                    } else nd.push(['']);
                  }
                }
                s.getRange(1, 1, nd.length, 1).setValues(nd);
              }
              
              var moveColAfter = function(colName, afterColName) {
                 var h1 = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0];
                 var frm = h1.indexOf(colName) + 1;
                 var tgt = h1.indexOf(afterColName) + 1;
                 if (frm > 0 && tgt > 0) {
                    var dst = frm < tgt ? tgt : tgt + 1;
                    s.moveColumns(s.getRange(1, frm), dst);
                 }
              };
              
              var moveColBefore = function(colName, beforeColName) {
                 var h2 = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0];
                 var frm = h2.indexOf(colName) + 1;
                 var tgt = h2.indexOf(beforeColName) + 1;
                 if (frm > 0 && tgt > 0) {
                    var dst = frm < tgt ? tgt - 1 : tgt;
                    s.moveColumns(s.getRange(1, frm), dst);
                 }
              };

              moveColAfter('Location In', 'Clock In');
              moveColAfter('Location Out', 'Clock Out');
              
              // Move Timestamp to right before Reason
              var h3 = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0];
              var tIdx = h3.indexOf('Timestamp') + 1;
              var rIdx = h3.indexOf('Reason') + 1;
              if (tIdx > 0) {
                if (rIdx > 0) {
                  moveColBefore('Timestamp', 'Reason');
                } else {
                  // no reason column, put it at end
                  s.moveColumns(s.getRange(1, tIdx), s.getLastColumn());
                }
              }
            }
          }
      });

      // Re-order sheets to group them
      var allSheets = doc.getSheets();
      var sortedSheets = allSheets.slice().sort(function(a, b) {
         var an = a.getName();
         var bn = b.getName();
         var aw = 0; var bw = 0;
         if (an.indexOf('1st-15th') >= 0) aw += 1000;
         else if (an.indexOf('16th-End') >= 0) aw += 2000;
         else if (an.indexOf('Full Month') >= 0) aw += 3000;
         if (an.indexOf('Master') >= 0) aw -= 100;
         
         if (bn.indexOf('1st-15th') >= 0) bw += 1000;
         else if (bn.indexOf('16th-End') >= 0) bw += 2000;
         else if (bn.indexOf('Full Month') >= 0) bw += 3000;
         if (bn.indexOf('Master') >= 0) bw -= 100;

         if (aw !== bw) return aw - bw;
         return an.localeCompare(bn);
      });

      // Reorder if needed
      var moves = 0;
      for (var isi = 0; isi < sortedSheets.length; isi++) {
        var expectedSheet = sortedSheets[isi];
        var currentSheets = doc.getSheets();
        if (currentSheets[isi].getName() !== expectedSheet.getName() && moves < 20) { // Limit to 20 moves to be safe on execution
          doc.setActiveSheet(expectedSheet);
          doc.moveActiveSheet(isi + 1);
          moves++;
        }
      }

      // Re-calculate the Hourly Pay for WN category in May
      if (doc.getName().indexOf('May') > -1) {
        existingSheets.forEach(function(s) {
           if (s.getLastColumn() > 0 && s.getLastRow() > 1) {
             var headers = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0];
             var catIdx = headers.indexOf('Category');
             var hourlyPayIdx = headers.indexOf('Hourly Pay');
             var totalHoursIdx = headers.indexOf('Total Hours');
             
             if (catIdx > -1 && hourlyPayIdx > -1 && totalHoursIdx > -1) {
               var dataRange = s.getRange(2, 1, s.getLastRow() - 1, s.getLastColumn());
               var dVals = dataRange.getValues();
               var formulaRange = s.getRange(2, hourlyPayIdx + 1, s.getLastRow() - 1, 1);
               var formulas = formulaRange.getFormulas();
               var needsUpdate = false;
               
               for (var rx = 0; rx < dVals.length; rx++) {
                 if (dVals[rx][catIdx] === 'WN') {
                   // Calculate Excel column letter correctly, wait, we have getColLetter out of scope possibly?
                   // No getColLetter is defined below this migration block. Let's redefine it or move it up.
                   // So instead of getColLetter we will copy the function.
                   var temp, letter = '';
                   var col = totalHoursIdx + 1;
                   while (col > 0) {
                     temp = (col - 1) % 26;
                     letter = String.fromCharCode(temp + 65) + letter;
                     col = (col - temp - 1) / 26;
                   }
                   var tHoursL = letter;
                   var expectedFormula = '=' + tHoursL + (rx + 2) + ' * 55';
                   if (formulas[rx][0] !== expectedFormula) {
                     formulas[rx][0] = expectedFormula;
                     needsUpdate = true;
                   }
                 }
               }
               if (needsUpdate) {
                 formulaRange.setFormulas(formulas);
               }
             }
           }
        });
      }
    } catch (e) {
      // Ignore migration errors so clockout still works
    }
    // --- END MIGRATION ---

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
          ? ['Date', 'Employee Name', 'Category', 'Clock In', 'Location In', 'Clock Out', 'Location Out', 'Total Hours', 'Hourly Pay', 'Bonus Pay', 'Total Pay', 'Reason', 'Timestamp']
          : ['Date', 'Category', 'Clock In', 'Location In', 'Clock Out', 'Location Out', 'Total Hours', 'Hourly Pay', 'Bonus Pay', 'Total Pay', 'Reason', 'Timestamp'];
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

      var dateString = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();

      var rowData = {
        'Date': dateString,
        'Timestamp': new Date(),
        'Employee Name': data.employeeName,
        'Category': data.category,
        'Clock In': data.clockIn,
        'Location In': data.locationIn,
        'Clock Out': data.clockOut,
        'Location Out': data.locationOut,
        'Total Hours': '', // Will be filled with formula
        'Hourly Pay': '',  // Will be filled with formula
        'Bonus Pay': '',   // Will be filled with formula
        'Total Pay': '',   // Will be filled with formula
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

    // --- LOGGING ---
    var firstName = data.employeeName ? data.employeeName.split(' ')[0] : '';
    
    var periodPrefix = day <= 15 ? "1st-15th" : "16th-End";
    var sheetMasterPeriod = periodPrefix + " Master";
    var sheetIndivPeriod = periodPrefix + " " + firstName;
    
    var sheetMasterFull = "Full Month Master";
    var sheetIndivFull = "Full Month " + firstName;

    // Log to Master sheet specific to the Pay Period
    logToSheet(sheetMasterPeriod, true);
    
    // Log to Individual sheet specific to the Pay Period
    if (data.employeeName) {
      logToSheet(sheetIndivPeriod, false);
    }

    // Log to Master sheet for the entire month
    logToSheet(sheetMasterFull, true);

    // Log to Individual sheet for the entire month
    if (data.employeeName) {
      logToSheet(sheetIndivFull, false);
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


