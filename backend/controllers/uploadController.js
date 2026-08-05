const fs = require('fs');
const path = require('path');

exports.uploadFile = async (req, res) => {
  try {
    const { filename, filedata } = req.body;
    if (!filedata) {
      return res.status(400).json({ error: 'No file data provided.' });
    }

    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    let base64Data = filedata;
    let ext = 'png';

    if (filedata.includes(';base64,')) {
      const parts = filedata.split(';base64,');
      const mime = parts[0].split(':')[1];
      if (mime.includes('pdf')) ext = 'pdf';
      else if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
      else if (mime.includes('png')) ext = 'png';
      else if (mime.includes('webp')) ext = 'webp';
      base64Data = parts[1];
    } else if (filename && filename.includes('.')) {
      ext = filename.split('.').pop();
    }

    const cleanFilename = filename ? filename.split('.')[0].replace(/[^a-zA-Z0-9_-]/g, '') : 'doc';
    const safeName = `${cleanFilename}_${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, safeName);

    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

    const fileUrl = `/uploads/${safeName}`;
    res.json({ message: 'File uploaded successfully', url: fileUrl, filename: safeName });
  } catch (error) {
    console.error('Error in uploadFile:', error);
    res.status(500).json({ error: error.message });
  }
};
