require('dotenv').config();
const express = require('express');
const session = require('express-session');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const app = express();
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('fontkit');
PDFDocument.prototype.registerFontkit(fontkit);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


// Session setup
app.use(session({
  secret: 'Maklunat customer', // tukar ni untuk production
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // kalau HTTPS, tukar true
}));

// Serve public HTML
app.use(express.static(path.join(__dirname, 'public')));

// Login route
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;

  console.log("Login Attempt:", username, password);
  console.log("ENV Credentials:", adminUser, adminPass);

  if (
    username.toLowerCase() === adminUser.toLowerCase() &&
    password === adminPass
  ) {
    req.session.isAdmin = true;
    console.log("✅ Login success");
    return res.json({ success: true });
  }

  console.log("❌ Login failed");
  res.json({ success: false });
});

// Protect admin route
app.get('/admin', (req, res) => {
  if (req.session.isAdmin) {
    res.sendFile(path.join(__dirname,'views','admin.html'));
  } else {
    res.redirect('/login.html');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login.html');
  });
});

// Homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});


function drawWrappedText(page, text, x, y, font, size, maxWidth, lineHeight = 12) {
  const words = text.split(' ');
  let line = '';
  let lines = [];

  for (let word of words) {
    const testLine = line + word + ' ';
    const width = font.widthOfTextAtSize(testLine, size);
    if (width > maxWidth) {
      lines.push(line.trim());
      line = word + ' ';
    } else {
      line = testLine;
    }
  }
  lines.push(line.trim());

  lines.forEach((lineText, index) => {
    page.drawText(lineText, {
      x,
      y: y - (index * lineHeight),
      size,
      font,
      color: rgb(0, 0, 0)
    });
  });
}

async function generateFilledPdf(templatePath, data, customFont = null) {
  const existingPdfBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  // Register fontkit sebelum embed font
  pdfDoc.registerFontkit(fontkit);

  const pages = pdfDoc.getPages();
  const mm = 2.83;

  // Load custom font atau guna parameter customFont
  const fontBytes = fs.readFileSync('./fonts/NotoSans-Regular.ttf');

  const font = customFont || await pdfDoc.embedFont(fontBytes);

  // Tentukan template dan lukis medan admin
  const templateName = path.basename(templatePath);

  if (templateName.includes('booking-template')) {
    drawAdminFieldsBooking(pages[0], data.property || {}, mm, font);
  } else if (templateName.includes('borang2-template')) {
    drawAdminFieldsBorang2(pages[0], data.property || {}, mm, font);
  }


  const firstPage = pages[0]; // Tambah ini sebelum positions
  let positions = {};
  let signaturePosition = { x: 65 * mm, y: 25 * mm };


  // ==== Koordinat Field Setiap PDF ====
  switch (templatePath) {
    case './templates/booking-template.pdf':
      positions = {
        customerName: { x: 19 * mm, y: 176 * mm, size: 7 },
        customerIc: { x: 91.31 * mm, y: 176 * mm, size: 9 },
        customerAddress: { x: 67 * mm, y: 153 * mm, size: 8 },
        customerPhone: { x: 129.28 * mm, y: 176 * mm, size: 9 },
        customerRace: { x: 68.85 * mm, y: 176 * mm, size: 9 },
        customerEmail: { x: 155 * mm, y: 176 * mm, size: 8 },
       
        coapplicantName1: { x: 19 * mm, y: 170 * mm, size: 7 },
        coapplicantIC1: { x: 91.31 * mm, y: 170 * mm, size: 9 },
        coapplicantPhone1: { x: 129.28 * mm, y: 170 * mm, size: 9 },
        coapplicantEmail1: { x: 155 * mm, y: 170 * mm, size: 9 },
        coapplicantRace1: { x: 68.85 * mm, y: 170 * mm, size: 8 },
        coapplicantName2: { x: 19 * mm, y: 243 * mm, size: 7 },
       
        coapplicantIC2: { x: 91.31 * mm, y: 243 * mm, size: 9 },
        coapplicantPhone2: { x: 129.28 * mm, y: 243 * mm, size: 9 },
        coapplicantEmail2: { x: 155 * mm, y: 243 * mm, size: 9 },
        coapplicantRace2: { x: 68.85 * mm, y: 243 * mm, size: 8 },
        coapplicantName3: { x: 19 * mm, y: 159 * mm, size: 7 },
      
        coapplicantIC3: { x: 91.31 * mm, y: 159 * mm, size: 9 },
        coapplicantPhone3: { x: 129.28 * mm, y: 159 * mm, size: 9 },
        coapplicantEmail3: { x: 155 * mm, y: 159 * mm, size: 9 },
        coapplicantRace3: { x: 68.85 * mm, y: 159 * mm, size: 8 },
      
        submissionDate1: { x: 154 * mm, y: 115 * mm, size: 10 },
        submissionDate2: { x: 28 * mm, y: 22 * mm, size: 10 },
        submissionDate3: { x: 124 * mm, y: 22 * mm, size: 10 },
       
        allApplicantNames: { x: 28 * mm, y: 29 * mm, size: 7 },
        allSignatures: [
          { key: 'signatureData', x: 20 * mm, y: 37 * mm },
          { key: 'coapplicantSignatureData1', x: 40 * mm, y: 37 * mm },
          { key: 'coapplicantSignatureData2', x: 60 * mm, y: 37 * mm },
          { key: 'coapplicantSignatureData3', x: 80 * mm, y: 37 * mm }
        ]
      };
      break;

    case './templates/pdpa1-template.pdf':
      positions = {
        customerName: { x: 67 * mm, y: 60.5 * mm, size: 12 },
        customerIc: { x: 67 * mm, y: 52 * mm, size: 12 },
        customerPhone: { x: 67 * mm, y: 44 * mm, size: 12 },
        submissionDate: { x: 143 * mm, y: 24.5 * mm, size: 10 },
        allSignatures: [
          { key: 'signatureData', x: 55 * mm, y: 27 * mm },
          { key: 'coapplicantSignatureData1', x: 70 * mm, y: 27 * mm },
          { key: 'coapplicantSignatureData2', x: 85 * mm, y: 27 * mm },
          { key: 'coapplicantSignatureData3', x: 100 * mm, y: 27 * mm }
        ]
      };
      break;

    case './templates/borang2-template.pdf':
      positions = {
        customerName: { x: 51 * mm, y: 221 * mm, size: 10 },
        submissionDate1: { x: 51 * mm, y: 229 * mm, size: 10 },
        submissionDate2: { x: 30 * mm, y: 31 * mm, size: 10 },
        coapplicantName1: { x: 51 * mm, y: 212 * mm, size: 10 },
        allApplicantNames:{ x: 30 * mm, y: 38 * mm, size: 10 },
        allSignatures: [
          { key: 'signatureData', x: 20 * mm, y: 43 * mm },
          { key: 'coapplicantSignatureData1', x: 40 * mm, y: 43 * mm },
          { key: 'coapplicantSignatureData2', x: 60 * mm, y: 43 * mm },
          { key: 'coapplicantSignatureData3', x: 80 * mm, y: 43 * mm }
        ]
      };
      break;

    case './templates/borang3-template.pdf':
      positions = {
        customerName: { x: 25 * mm, y: 67 * mm, size: 10 },
        customerIc: { x: 32 * mm, y: 61.5 * mm, size: 10 },
        customerPosition: { x: 34 * mm, y: 56 * mm, size: 10 },
        customerPhone: { x: 39 * mm, y: 50 * mm, size: 10 },

        coapplicantName1: { x: 128 * mm, y: 67 * mm, size: 10 },
        coapplicantIC1: { x: 135 * mm, y: 61.5 * mm, size: 10 },
        coapplicantPosition1: { x: 137 * mm, y: 56 * mm, size: 10 },
        coapplicantPhone1: { x: 141 * mm, y: 50 * mm, size: 10 },
        allSignatures: [
          { key: 'signatureData', x: 30 * mm, y: 80 * mm },
          { key: 'coapplicantSignatureData1', x: 130 * mm, y: 80 * mm },
        ]
      };
      break;
  }

  // ==== Logic Isi PDF ====
  const combinedNames = [data.customerName, data.coapplicantName1, data.coapplicantName2, data.coapplicantName3]
    .filter(Boolean).join(' / ');
  const combinedICs = [data.customerIc, data.coapplicantIC1, data.coapplicantIC2, data.coapplicantIC3]
    .filter(Boolean).join(' / ');
  const combinedPhones = [data.customerPhone, data.coapplicantPhone1, data.coapplicantPhone2, data.coapplicantPhone3]
    .filter(Boolean).join(' / ');

  for (const key in positions) {
    if (!['allSignatures', 'allApplicantNames'].includes(key) && data[key]) {
      const val = data[key].toString();
      const pos = positions[key];

      if (key === 'customerAddress') {
        const cleanText = val.replace(/\n/g, ' ').replace(/\r/g, '');
        drawWrappedText(firstPage, cleanText, pos.x, pos.y, font, pos.size, 120);
      }

      // Ganti maklumat pdpa dengan gabungan semua penama
      else if (templatePath === './templates/pdpa1-template.pdf') {
        if (key === 'customerName') {
          firstPage.drawText(combinedNames, { x: pos.x, y: pos.y, size: pos.size, font, color: rgb(0, 0, 0) });
        } else if (key === 'customerIc') {
          firstPage.drawText(combinedICs, { x: pos.x, y: pos.y, size: pos.size, font, color: rgb(0, 0, 0) });
        } else if (key === 'customerPhone') {
          firstPage.drawText(combinedPhones, { x: pos.x, y: pos.y, size: pos.size, font, color: rgb(0, 0, 0) });
        } else if (key === 'submissionDate') {
          firstPage.drawText(val, { x: pos.x, y: pos.y, size: pos.size, font, color: rgb(0, 0, 0) });
        }
      }

      // Template lain tulis macam biasa
      else {
        firstPage.drawText(val, { x: pos.x, y: pos.y, size: pos.size, font, color: rgb(0, 0, 0) });
      }
    }
  }

  // Nama semua penama di bawah tandatangan (jika ada)
  if (positions.allApplicantNames) {
    firstPage.drawText(combinedNames, {
      x: positions.allApplicantNames.x,
      y: positions.allApplicantNames.y,
      size: positions.allApplicantNames.size,
      font,
      color: rgb(0, 0, 0)
    });
  }

  // Tandatangan semua penama
  for (const sig of positions.allSignatures || []) {
    const imageData = data[sig.key];
    if (imageData?.startsWith('data:image')) {
      const signatureImage = await pdfDoc.embedPng(imageData);
      firstPage.drawImage(signatureImage, {
        x: sig.x,
        y: sig.y,
        width: 100,
        height: 40
      });
    }
  }

  return await pdfDoc.save();
}

//===========================ADMIN FORM====================
function drawLine(page, x1, y1, x2, y2) {
  page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 1, color: rgb(0, 0, 0) });
}

function formatRM(num) {
  const n = parseFloat(num);
  return isNaN(n) ? '-' : `RM${n.toLocaleString('en-MY', { maximumFractionDigits: 0 })}`;
}

function drawAdminFieldsBooking(page, data, mm, font) {
  // Garis Jenis Binaan
  if (data.jenisBinaan === '1 Tingkat') drawLine(page, 48 * mm, 226 * mm, 71 * mm, 226 * mm);
  else if (data.jenisBinaan === '2 Tingkat') drawLine(page, 73 * mm, 226 * mm, 98 * mm, 226 * mm);

  // Garis Jenis Lot
  if (data.jenisLot === 'Tengah') drawLine(page, 48 * mm, 221.5 * mm, 61 * mm, 221.5 * mm);
  else if (data.jenisLot === 'Endlot') drawLine(page, 67.5 * mm, 221.5 * mm, 78 * mm, 221.5 * mm);
  else if (data.jenisLot === 'Corner') drawLine(page, 81 * mm, 221.5 * mm, 97 * mm, 221.5 * mm);

  // Garis Cara Bayaran
  if (data.caraBayaran === 'Cash') drawLine(page, 154 * mm, 101 * mm, 161 * mm, 101 * mm);
  else if (data.caraBayaran === 'Online Transfer') drawLine(page, 163 * mm, 101 * mm, 184 * mm, 101 * mm);
  else if (data.caraBayaran === 'Bank Draft') drawLine(page, 186 * mm, 101 * mm, 191 * mm, 101 * mm);

  // Isian Teks
  const textFields = [
    { key: 'luasBinaan', x: 154 * mm, y: 234 * mm },
    { key: 'noPT', x: 47.95 * mm, y: 218 * mm },
    { key: 'noHSD', x: 47.95 * mm, y: 213 * mm },
    { key: 'noUnit', x: 47.95 * mm, y: 207 * mm },
    { key: 'luasStandard', x: 173 * mm, y: 229 * mm },
    { key: 'luasLebihan', x: 173 * mm, y: 223 * mm },
    { key: 'luasJumlah', x: 173 * mm, y: 216 * mm },
    { key: 'hargaAsal', x: 72 * mm, y: 116 * mm },
    { key: 'diskaunBumi', x: 72 * mm, y: 110 * mm },
    { key: 'hargaSPA', x: 72 * mm, y: 98 * mm },
    { key: 'bayaranBooking', x: 154 * mm, y: 109 * mm },
    { key: 'tarikhUptodate', x: 154 * mm, y: 116 * mm }
  ];

  for (const field of textFields) {
    let value = data[field.key];

    if (field.key === 'hargaAsal' || field.key === 'hargaSPA' || field.key === 'bayaranBooking') {
      value = formatRM(value);
    }

    if (field.key === 'diskaunBumi') {
      const dis = parseFloat(data.diskaunBumi);
      value = isNaN(dis) ? '' : `${dis}%`;
      }
    

    if (value !== undefined && value !== null && value !== '') {
      page.drawText(value.toString(), {
        x: field.x,
        y: field.y,
        size: 10,
        font,
        color: rgb(0, 0, 0)
      });
    }
  }
}

function drawAdminFieldsBorang2(page, data, mm, font) {
  if (data.jenisBinaan === '1 Tingkat') drawLine(page, 50 * mm, 243 * mm, 77 * mm, 243 * mm);
  else if (data.jenisBinaan === '2 Tingkat') drawLine(page, 79 * mm, 243 * mm, 106 * mm, 243 * mm);

  if (data.jenisLot === 'Tengah') drawLine(page, 50 * mm, 235 * mm, 70 * mm, 235 * mm);
  else if (data.jenisLot === 'Endlot') drawLine(page, 72 * mm, 235 * mm, 85 * mm, 235 * mm);
  else if (data.jenisLot === 'Corner') drawLine(page, 86 * mm, 235 * mm, 104 * mm, 235 * mm);

  if (data.statusBumi === 'Bumi') drawLine(page, 148 * mm, 235 * mm, 152 * mm, 235 * mm);
  else if (data.statusBumi === 'Non-Bumi') drawLine(page, 155 * mm, 235 * mm, 164 * mm, 235 * mm);

  const fields = [
    { key: 'noPT', x: 150 * mm, y: 252 * mm },
    { key: 'noUnit', x: 150 * mm, y: 246 * mm },
    { key: 'hargaAsal', x: 159 * mm, y: 186.4 * mm },
    { key: 'diskaunBumi', x: 66 * mm, y: 179 * mm },
    { key: 'jumlahDiskaun', x: 159 * mm, y: 179 * mm },
    { key: 'hargaSPA', x: 159 * mm, y: 164.5 * mm },
    { key: 'rebate', x: 65 * mm, y: 156 * mm },
    { key: 'jumlahRebate', x: 159 * mm, y: 156 * mm },
    { key: 'hargaFinal', x: 159 * mm, y: 150 * mm }
  ];

 for (const f of fields) {
  let value = data[f.key];

  if (f.key === 'hargaAsal' || f.key === 'hargaSPA' || f.key === 'hargaFinal' || f.key === 'jumlahDiskaun' || f.key === 'jumlahRebate') {
    value = formatRM(value);
  }

  if (f.key === 'rebate') {
    const rebateVal = parseFloat(data.rebate);
    value = isNaN(rebateVal) ? '' : `${rebateVal}%`;
  }

  if (f.key === 'diskaunBumi') {
    const dis = parseFloat(data.diskaunBumi);
    value = isNaN(dis) ? '' : `${dis}%`;
  }

  if (value !== undefined && value !== null && value !== '') {
    page.drawText(value.toString(), {
      x: f.x,
      y: f.y,
      size: 10,
      font,
      color: rgb(0, 0, 0)
    });
  }
}


  const pembiayaan = data.pembiayaan || [];
  if (pembiayaan.includes('Bank')) page.drawText('X', { x: 152.3 * mm, y: 229.5 * mm, size: 12, font });
  if (pembiayaan.includes('LPPSA')) page.drawText('X', { x: 152.3 * mm, y: 221.3 * mm, size: 12, font });
  if (pembiayaan.includes('Tunai')) page.drawText('X', { x: 152.3 * mm, y: 213.2 * mm, size: 12, font });

const dokumen = data.dokumen || [];
if (dokumen.includes('SPA')) page.drawText('X', { x: 54 * mm, y: 120.5 * mm, size: 12, font });
if (dokumen.includes('MOT')) page.drawText('X', { x: 54 * mm, y: 112.5 * mm, size: 12, font });
if (dokumen.includes('Bank')) page.drawText('X', { x: 54 * mm, y: 104.5 * mm, size: 12, font });
if (dokumen.includes('MOC')) page.drawText('X', { x: 54 * mm, y: 96.4 * mm, size: 12, font });

}


// ================== ROUTE =====================

app.post('/submitBooking', async (req, res) => {
  try {
    const {
      customerName, customerIc, customerAddress, customerPhone, customerEmail, customerPosition, customerRace,
      coapplicantName1, coapplicantIC1, coapplicantPhone1, coapplicantEmail1, coapplicantRace1, coapplicantPosition1,
      coapplicantName2, coapplicantIC2, coapplicantPhone2, coapplicantEmail2, coapplicantRace2, coapplicantPosition2,
      coapplicantName3, coapplicantIC3, coapplicantPhone3, coapplicantEmail3, coapplicantRace3, coapplicantPosition3,
      signatureData, coapplicantSignatureData1, coapplicantSignatureData2, coapplicantSignatureData3
    } = req.body;

    const submissionDate = new Date().toLocaleDateString();
    const requiredTemplates = [
      './templates/booking-template.pdf',
      './templates/pdpa1-template.pdf',
      './templates/borang2-template.pdf',
      './templates/borang3-template.pdf'
    ];

    const outputDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const generatedFiles = [];

    for (const templatePath of requiredTemplates) {
      const filledPdfBytes = await generateFilledPdf(templatePath, {
        customerName1: customerName,
        customerName2: customerName,
        customerName,
        customerIc,
        customerAddress,
        customerPhone,
        customerPosition,
        customerRace,
        customerEmail,
        coapplicantName1,
        coapplicantIC1,
        coapplicantPhone1,
        coapplicantEmail1,
        coapplicantRace1,
        coapplicantPosition1,
        coapplicantName2,
        coapplicantIC2,
        coapplicantPhone2,
        coapplicantEmail2,
        coapplicantRace2,
        coapplicantPosition2,
        coapplicantName3,
        coapplicantIC3,
        coapplicantPhone3,
        coapplicantEmail3,
        coapplicantRace3,
        coapplicantPosition3,
        signatureData,
        coapplicantSignatureData1,
        coapplicantSignatureData2,
        coapplicantSignatureData3,
        submissionDate,
        submissionDate1: submissionDate,
        submissionDate2: submissionDate,
        submissionDate3: submissionDate
      });

      const fileName = `booking_${path.basename(templatePath, '.pdf')}_${Date.now()}.pdf`;
      const outputPath = path.join(outputDir, fileName);
      fs.writeFileSync(outputPath, filledPdfBytes);
      generatedFiles.push(outputPath);
    }

    // Tambah borang bacaan (tak perlu isi)
    const staticTemplates = [
      './templates/pdpa2-template.pdf',
      './templates/pdpa3-template.pdf',
      './templates/pdpa4-template.pdf'
    ];

    for (const staticPath of staticTemplates) {
      if (fs.existsSync(staticPath)) {
        generatedFiles.push(staticPath);
      }
    }

    // Gabungkan semua fail PDF ke dalam satu
    const finalMergedPdf = await PDFDocument.create();

    for (const file of generatedFiles) {
      const bytes = fs.readFileSync(file);
      const doc = await PDFDocument.load(bytes);
      const pages = await finalMergedPdf.copyPages(doc, doc.getPageIndices());
      pages.forEach(p => finalMergedPdf.addPage(p));
    }

    // Gabungkan nama penama
    const allNames = [customerName, coapplicantName1, coapplicantName2, coapplicantName3]
      .filter(Boolean)
      .join(' & ')
      .replace(/[\/\\:*?"<>|]/g, ''); // buang karakter tak sah

    const finalFilename
 = `${allNames}_BorangTempahan.pdf`;
    const finalPath = path.join(outputDir, finalFilename
);
    const finalBytes = await finalMergedPdf.save();
    fs.writeFileSync(finalPath, finalBytes);

    // Hantar kepada admin & customer
    await transporter.sendMail({
      from: `Borang Tempahan <${process.env.EMAIL_USER}>`,
      to: [process.env.EMAIL_USER],
      subject: '📄 Borang Tempahan Rumah',
      text: 'Terima kasih kerana menghantar borang. Dilampirkan semua dokumen.',
      attachments: [
        {
          filename: path.basename(finalPath),
          path: finalPath
        }
      ]
    });

    const dbPath = path.join(__dirname, 'submitBooking', 'database.json');
let db = [];
if (fs.existsSync(dbPath)) {
  const fileContent = fs.readFileSync(dbPath, 'utf8');
  if (fileContent.trim()) {
    db = JSON.parse(fileContent);
  }
}

const newId = db.length > 0 ? Math.max(...db.map(item => item.id || 0)) + 1 : 1;

const newRecord = {
  id: newId,
  tarikhSubmit: submissionDate,
  customerName,
  customerIc,
  customerAddress,
  customerPhone,
  customerPosition,
  customerRace,
  customerEmail,
  pdfFilename: finalFilename
,
  status: "new",
  ...req.body
};

db.push(newRecord);
console.log('✅ Nak tulis database:', newRecord);
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('✅ Dah tulis database.json');

    // Simpan salinan PDF ke dalam folder archive sebelum padam
    const archiveDir = path.join(__dirname, 'submitBooking', 'archive');
    if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });

    const archivePath = path.join(archiveDir, finalFilename
);
    fs.copyFileSync(finalPath, archivePath); // Simpan salinan dahulu

    // Clean up (padam selepas backup)
    generatedFiles.forEach(f => fs.existsSync(f) && fs.unlinkSync(f));
    fs.unlinkSync(finalPath);
 


    res.json({ message: 'Borang berjaya dihantar.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Ralat semasa proses penghantaran.' });
  }
});

// ================== CONSTANTS =====================
const databasePath = path.join(__dirname, 'submitBooking', 'database.json');
const archiveDir = path.join(__dirname, 'submitBooking', 'archive');
if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });

// ================== UTILITY =====================
function safeFilename(name) {
  return name ? name.replace(/[\/\\:*?"<>|]/g, '') : 'unknown';
}

// ================== PDF GENERATOR =====================
async function generateAdminPdfAndSend(fullData) {
  const submissionDate = new Date().toLocaleDateString();

  const templates = [
    './templates/booking-template.pdf',
    './templates/pdpa1-template.pdf',
    './templates/borang2-template.pdf',
    './templates/borang3-template.pdf'
  ];

  const outputDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const generatedFiles = [];

  for (const template of templates) {
    const filled = await generateFilledPdf(template, {
      ...fullData,
      submissionDate,
      submissionDate1: submissionDate,
      submissionDate2: submissionDate,
      submissionDate3: submissionDate
    });

    const filename = `admin_${path.basename(template, '.pdf')}_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, filename);
    fs.writeFileSync(outputPath, filled);
    generatedFiles.push(outputPath);
  }

  const staticTemplates = [
    './templates/pdpa2-template.pdf',
    './templates/pdpa3-template.pdf',
    './templates/pdpa4-template.pdf'
  ];

  for (const staticPath of staticTemplates) {
    if (fs.existsSync(staticPath)) generatedFiles.push(staticPath);
  }

  const finalDoc = await PDFDocument.create();
  for (const file of generatedFiles) {
    const doc = await PDFDocument.load(fs.readFileSync(file));
    const pages = await finalDoc.copyPages(doc, doc.getPageIndices());
    pages.forEach(p => finalDoc.addPage(p));
  }

  const filename = `${safeFilename(fullData.customerName)}_BorangTempahan.pdf`;
  const finalPath = path.join(archiveDir, filename);
  fs.writeFileSync(finalPath, await finalDoc.save());

  const db = JSON.parse(fs.readFileSync(databasePath));
  const index = db.findIndex(x => x.id === fullData.id);
  if (index !== -1) {
    db[index].pdfFilename = filename;
    fs.writeFileSync(databasePath, JSON.stringify(db, null, 2));
  }

  await transporter.sendMail({
    from: `Admin Tempahan <${process.env.EMAIL_USER}>`,
    to: [process.env.EMAIL_USER],
    subject: '📄 Borang Tempahan Lengkap (Isi oleh Admin)',
    text: 'Borang lengkap telah dijana oleh admin. Sila semak dokumen.',
    attachments: [{ filename, path: finalPath }]
  });

  // Clean temp files
  // Clean up (padam selepas backup) - Ensure only generated files are deleted
  generatedFiles.forEach(f => {
    // Make sure only files in 'temp' directory are deleted
    if (f.includes('temp') && fs.existsSync(f)) {
      fs.unlinkSync(f);
    }
  });
  
  fs.unlinkSync(finalPath); // This should also be a generated file
}






// ================== ROUTES =====================

// ✅ Generate PDF dari Admin Input
app.post('/admin/generate-pdf/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const propertyData = req.body;

    if (!fs.existsSync(databasePath)) return res.status(404).json({ message: "Database tidak wujud." });

    const db = JSON.parse(fs.readFileSync(databasePath));
    const recordIndex = db.findIndex(x => x.id === id);
    if (recordIndex === -1) return res.status(404).json({ message: "Rekod tidak ditemui." });

    db[recordIndex].property = propertyData;
    db[recordIndex].status = 'admin update'; // atau 'updated' ikut suka kau
    fs.writeFileSync(databasePath, JSON.stringify(db, null, 2));


    const fullData = {
      ...propertyData,
      ...db[recordIndex],
      property: propertyData
    };

    await generateAdminPdfAndSend(fullData);
    res.status(200).json({ message: "PDF berjaya dijana & dihantar." });
  } catch (err) {
    console.error("❌ Gagal jana PDF/emel:", err);
    res.status(500).json({ message: "Ralat menjana PDF.", error: err.message });
  }
});

// ✅ Senarai borang
app.get('/admin/list', (req, res) => {
  if (!fs.existsSync(databasePath)) return res.json([]);
  const data = JSON.parse(fs.readFileSync(databasePath));
  res.json(data.map(x => ({
    id: x.id,
    nama: x.customerName,
    tarikh: x.tarikhSubmit || '-',
    status: x.status || 'new',
    pdfFilename: x.pdfFilename || null
  })));
});

// ✅ Papar HTML
app.get('/admin/view/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-view.html'));
});

// ✅ Data satu borang
app.get('/admin/data/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (!fs.existsSync(databasePath)) return res.status(404).json({ message: "Tiada data disimpan." });
  const data = JSON.parse(fs.readFileSync(databasePath));
  const record = data.find(x => x.id === id);
  if (!record) return res.status(404).json({ message: "Rekod tidak dijumpai." });
  res.json(record);
});

// ✅ Muat turun PDF
app.get('/admin/download/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (!fs.existsSync(databasePath)) return res.status(404).send("Tiada rekod");

  const data = JSON.parse(fs.readFileSync(databasePath));
  const record = data.find(x => x.id === id);
  if (!record) return res.status(404).send("Rekod tidak dijumpai");

  const fileName = `${safeFilename(record.customerName)}_BorangTempahan.pdf`;
  const pdfPath = path.join(archiveDir, fileName);

  if (fs.existsSync(pdfPath)) {
    if (!record.status || record.status === 'new') {
      record.status = 'dilihat';
      const index = data.findIndex(x => x.id === id);
      data[index] = record;
      fs.writeFileSync(databasePath, JSON.stringify(data, null, 2));
    }
    return res.download(pdfPath);
  } else {
    return res.status(404).send("Fail PDF tidak dijumpai.");
  }
});

// ✅ Update status
app.post('/admin/status/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { status, komen } = req.body;

  if (!fs.existsSync(databasePath)) return res.status(404).json({ message: 'Tiada database.' });
  const data = JSON.parse(fs.readFileSync(databasePath));
  const index = data.findIndex(x => x.id === id);
  if (index === -1) return res.status(404).json({ message: 'Rekod tidak ditemui.' });

  data[index].status = status;
  data[index].komen = komen;
  fs.writeFileSync(databasePath, JSON.stringify(data, null, 2));

  res.status(200).json({ message: 'Status berjaya dikemaskini.' });
});

// ✅ Padam rekod
app.delete('/admin/delete/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (!fs.existsSync(databasePath)) return res.status(404).send("Tiada data");

  let data = JSON.parse(fs.readFileSync(databasePath));
  const index = data.findIndex(x => x.id === id);
  if (index === -1) return res.status(404).send("Rekod tak dijumpai");

  const record = data[index];
  const fileName = `${safeFilename(record.customerName)}_BorangTempahan.pdf`;
  const pdfPath = path.join(archiveDir, fileName);

  if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);

  data.splice(index, 1);
  fs.writeFileSync(databasePath, JSON.stringify(data, null, 2));

  res.status(200).send("Rekod berjaya dipadam");
});

// ✅ Tambah property oleh admin
app.post('/admin/property/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const propertyData = req.body;

  if (!fs.existsSync(databasePath)) return res.status(404).json({ message: "Database tidak wujud." });

  const db = JSON.parse(fs.readFileSync(databasePath));
  const recordIndex = db.findIndex(x => x.id === id);
  if (recordIndex === -1) return res.status(404).json({ message: "Rekod tidak ditemui." });

  db[recordIndex].property = propertyData;
  fs.writeFileSync(databasePath, JSON.stringify(db, null, 2));

  try {
    const fullData = {
      ...propertyData,
      ...db[recordIndex],
      property: propertyData
    };

    await generateAdminPdfAndSend(fullData);
    res.status(200).json({ message: "Maklumat berjaya dihantar & PDF dihantar." });
  } catch (err) {
    console.error("❌ Gagal jana PDF/emel:", err);
    res.status(500).json({ message: "Maklumat disimpan tapi gagal jana PDF/emel.", error: err.message });
  }
});

app.use(session({
  secret: 'unicorn-secret', // tukar ikut suka, tapi jangan share public
  resave: false,
  saveUninitialized: true
}));

// Dummy admin credential (kau boleh upgrade nanti pakai DB)
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'password123';

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});
