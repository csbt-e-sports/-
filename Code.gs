// Google Sheet में डेटा सेव करने के लिए मुख्य फंक्शन
function doPost(e) {
  try {
    // एक्टिव स्प्रेडशीट और शीट प्राप्त करें
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Registrations') || ss.getActiveSheet();
    
    // पोस्ट किया गया डेटा पार्स करें
    const data = JSON.parse(e.postData.contents);
    
    // टाइमस्टैम्प जोड़ें
    const timestamp = new Date();
    
    // डेटा को एक एरे में व्यवस्थित करें
    const rowData = [
      timestamp,                    // रजिस्ट्रेशन का समय
      data.squadName,              // टीम का नाम
      data.email,                  // ईमेल
      data.phone,                  // फोन नंबर
      
      // टीम लीडर की जानकारी
      data.leaderName,
      data.leaderIGN,
      data.leaderBGMI,
      
      // प्लेयर 1 की जानकारी
      data.player1Name,
      data.player1IGN,
      data.player1BGMI,
      
      // प्लेयर 2 की जानकारी
      data.player2Name,
      data.player2IGN,
      data.player2BGMI,
      
      // प्लेयर 3 की जानकारी
      data.player3Name,
      data.player3IGN,
      data.player3BGMI,
      
      // सब्स्टिट्यूट प्लेयर की जानकारी
      data.subName,
      data.subIGN,
      data.subBGMI
    ];
    
    // अगर शीट खाली है तो हेडर्स जोड़ें
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
    
    // डेटा को शीट में जोड़ें
    sheet.appendRow(rowData);
    
    // सफलता रिस्पांस भेजें
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'success',
      'message': 'Registration data saved successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // एरर रिस्पांस भेजें
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// CORS हैंडलिंग के लिए doGet फंक्शन
function doGet(e) {
  return HtmlService.createHtmlOutput("Success");
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