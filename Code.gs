// Google Sheet में डेटा सेव करने के लिए मुख्य फंक्शन
function doPost(e) {
  try {
    // पोस्ट किया गया डेटा पार्स करें
    const data = JSON.parse(e.postData.contents || '{}');

    // Route by action: 'registerTeam' (existing), 'registerUser', 'login'
    const action = data.action || 'registerTeam';

    if (action === 'registerUser') {
      const result = registerUser(data);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        });
    }

    if (action === 'login') {
      const result = loginUser(data);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        });
    }

    if (action === 'submitPayment') {
      const result = submitPayment(data);
      return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeaders({
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        });
    }

    // Default: team registration flow (existing)
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Registrations') || ss.getActiveSheet();

    const timestamp = new Date();
    const rowData = [
      timestamp,
      data.squadName,
      data.email,
      data.phone,
      data.leaderName,
      data.leaderIGN,
      data.leaderBGMI,
      data.player1Name,
      data.player1IGN,
      data.player1BGMI,
      data.player2Name,
      data.player2IGN,
      data.player2BGMI,
      data.player3Name,
      data.player3IGN,
      data.player3BGMI,
      data.subName,
      data.subIGN,
      data.subBGMI
    ];

    if (sheet.getLastRow() === 0) {
      const headers = [
        'Timestamp',
        'Squad Name',
        'Email',
        'Phone',
        'Leader Name',
        'Leader IGN',
        'Leader BGMI ID',
        'Player 1 Name',
        'Player 1 IGN',
        'Player 1 BGMI ID',
        'Player 2 Name',
        'Player 2 IGN',
        'Player 2 BGMI ID',
        'Player 3 Name',
        'Player 3 IGN',
        'Player 3 BGMI ID',
        'Sub Name',
        'Sub IGN',
        'Sub BGMI ID'
      ];
      sheet.appendRow(headers);
    }

    sheet.appendRow(rowData);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Registration data saved successfully'
    })).setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    
  } catch (error) {
    // एरर रिस्पांस भेजें
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
  }
}

// CORS हैंडलिंग के लिए doGet फंक्शन
function doGet(e) {
  try {
    const callback = e.parameter.callback;
    const data = e.parameter.data;
    
    if (callback && data) {
      // JSONP request
      const payload = JSON.parse(data);
      let result;
      
      if (payload.action === 'registerUser') {
        result = registerUser(payload);
      } else if (payload.action === 'login') {
        result = loginUser(payload);
      } else {
        result = { status: 'error', message: 'Invalid action' };
      }
      
      const response = callback + '(' + JSON.stringify(result) + ');';
      return ContentService.createTextOutput(response)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    // Regular GET request
    return ContentService.createTextOutput("CSBT E-Sports API is running")
      .setMimeType(ContentService.MimeType.TEXT)
      .setHeaders({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
  } catch (error) {
    const callback = e.parameter.callback;
    if (callback) {
      const response = callback + '(' + JSON.stringify({
        status: 'error',
        message: error.toString()
      }) + ');';
      return ContentService.createTextOutput(response)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// डुप्लिकेट एंट्री चेक करने के लिए फंक्शन
function checkDuplicateEntry(email, phone, bgmiId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  // पहली रो (हेडर्स) को छोड़कर चेक करें
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === email ||          // ईमेल चेक
        data[i][3] === phone ||          // फोन नंबर चेक
        data[i][6] === bgmiId ||         // लीडर BGMI ID
        data[i][9] === bgmiId ||         // प्लेयर 1 BGMI ID
        data[i][12] === bgmiId ||        // प्लेयर 2 BGMI ID
        data[i][15] === bgmiId) {        // प्लेयर 3 BGMI ID
      return true;
    }
  }
  return false;
} 

// -----------------------------
// User auth helpers and routes
// -----------------------------

function registerUser(data) {
  const usersSheet = createOrGetUsersSheet();
  const email = String(data.email || '').trim().toLowerCase();
  const password = String(data.password || '');
  const name = String(data.name || '').trim();

  if (!email || !password) {
    return { status: 'error', message: 'Email and password are required' };
  }

  const existing = findUserByEmail(usersSheet, email);
  if (existing) {
    return { status: 'error', message: 'User already exists' };
  }

  const salt = Utilities.getUuid();
  const passwordHash = hashPassword(password, salt);
  const timestamp = new Date();

  if (usersSheet.getLastRow() === 0) {
    usersSheet.appendRow(['Timestamp', 'Name', 'Email', 'PasswordHash', 'Salt']);
  }
  usersSheet.appendRow([timestamp, name, email, passwordHash, salt]);

  return { status: 'success', message: 'User registered successfully' };
}

function loginUser(data) {
  const usersSheet = createOrGetUsersSheet();
  const email = String(data.email || '').trim().toLowerCase();
  const password = String(data.password || '');

  if (!email || !password) {
    return { status: 'error', message: 'Email and password are required' };
  }

  const user = findUserByEmail(usersSheet, email);
  if (!user) {
    return { status: 'error', message: 'Invalid credentials' };
  }

  const computed = hashPassword(password, user.salt);
  const ok = computed === user.passwordHash;
  if (!ok) {
    return { status: 'error', message: 'Invalid credentials' };
  }

  // Basic session token (non-JWT) for simplicity
  const token = Utilities.base64EncodeWebSafe(Utilities.getUuid());
  return {
    status: 'success',
    message: 'Login successful',
    user: { name: user.name, email: user.email },
    token: token
  };
}

function createOrGetUsersSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Users');
  if (!sheet) {
    sheet = ss.insertSheet('Users');
  }
  return sheet;
}

function findUserByEmail(usersSheet, email) {
  const data = usersSheet.getDataRange().getValues();
  if (data.length <= 1) return null; // only headers/no rows
  // Expect headers: Timestamp, Name, Email, PasswordHash, Salt
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[2]).toLowerCase() === email) {
      return {
        name: row[1],
        email: row[2],
        passwordHash: row[3],
        salt: row[4]
      };
    }
  }
  return null;
}

function hashPassword(password, salt) {
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password + salt);
  let hex = '';
  for (let i = 0; i < raw.length; i++) {
    const v = (raw[i] + 256) % 256;
    const h = v.toString(16);
    hex += h.length === 1 ? '0' + h : h;
  }
  return hex;
}

// -----------------------------
// Payments: Store and validate UTR
// -----------------------------

function submitPayment(data) {
  const utr = String(data.utr || '').trim();
  const orderId = String(data.orderId || '').trim();
  const email = String(data.email || '').trim();
  const phone = String(data.phone || '').trim();

  if (!utr) {
    return { status: 'error', message: 'UTR is required' };
  }
  if (utr.length !== 12 || !/^\d{12}$/.test(utr)) {
    return { status: 'error', message: 'UTR must be exactly 12 digits' };
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Payments');
  if (!sheet) {
    sheet = ss.insertSheet('Payments');
  }

  // Initialize headers if empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'UTR', 'Order ID', 'Email', 'Phone']);
  }

  // Check duplicate UTR in column 2 (index 1)
  const dataRange = sheet.getDataRange().getValues();
  for (let i = 1; i < dataRange.length; i++) {
    if (String(dataRange[i][1]).trim() === utr) {
      return { status: 'error', message: 'Duplicate UTR' };
    }
  }

  sheet.appendRow([new Date(), utr, orderId, email, phone]);
  return { status: 'success', message: 'Payment recorded' };
}