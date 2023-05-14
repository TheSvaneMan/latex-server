const express = require('express');
const app = express();
const formidable = require('formidable');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const cors = require("cors");

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Handle file upload
app.post('/compile', (req, res) => {
  const form = new formidable.IncomingForm();

  form.parse(req, (err, fields, files) => {
    console.log("fields: ", fields.texCode);
    if (err) {
      res.status(500).send('Error parsing form data');
      return;
    }

    try {
      if (!files.texFile || files.texFile.size === 0) {
        console.log('No file uploaded');
      } else if (!fields.texCode || files.texCode.length === 0) {
        console.log('No source code uploaded');
      } else {
        res.status(400).send('No file uploaded or code sent');
      }
    } catch (error) {
      res.status(400).send('Server error: ' + error);
    }

    if (files.texFile) {
      console.log("executed")
      const texFile = files.texFile;
      const texFilePath = texFile.filepath;

      // Specify the desired output file name here
      const outputFileName = 'document-output/pdfToTex';

      // Execute TeX Live command to compile the TeX file
      const command = 'pdflatex';
      const args = ['-interaction=nonstopmode', '-jobname=' + outputFileName, texFilePath];

      const texProcess = spawn(command, args);

      texProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });

      texProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });

      texProcess.on('close', (code) => {
        if (code === 0) {
          // Compilation successful, send the PDF file back to the client
          const pdfFilePath = path.join(outputFileName + '.pdf');
          res.download(outputFileName + '.pdf', (err) => {
            if (err) {
              console.error(err);
              res.status(500).send('Failed to download PDF');
            }

            // Cleanup: Remove the uploaded TeX and PDF files
            fs.unlink(texFilePath, (err) => {
              if (err) {
                console.error(err);
              }
            });
            fs.unlink(pdfFilePath, (err) => {
              if (err) {
                console.error(err);
              }
            });
          });
        } else {
          res.status(500).send('TeX compilation failed');
        }
      });
    } else if (typeof fields.texCode !== "undefined") {
      // Handle pure tex input data 
      // Handle document upload
      // Handle pure tex input data 
      console.log("__dirname: ", __dirname)

      const texCode = fields.texCode;

      const date = new Date().toDateString().replace(/\s/g, '');

      // Specify the desired output file name here
      const outputFileNamePDF = `pdf-document-output/pdf-output-${date}`;

      const latexCodeTexFileDir = path.join(__dirname, `/tex-files/tmp-tex-file-${date}.tex`);
      console.log("latexCodeTexFileDir: ", latexCodeTexFileDir)

      fs.writeFile(latexCodeTexFileDir, texCode, (err) => {
        if (err) {
          console.error(err);
          res.status(500).send('Error writing TeX file');
          return;
        }
      });

      // Execute TeX Live command to compile the TeX file
      const command = 'pdflatex';
      const args = ['-interaction=nonstopmode', '-jobname=' + outputFileNamePDF, latexCodeTexFileDir];

      const texProcess = spawn(command, args);

      texProcess.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });

      texProcess.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });

      texProcess.on('close', (code) => {
        console.log("code: out", code)
        if (code === 1) {
          console.log("code: in")
          // Compilation successful, send the PDF file back to the client
          const pdfFilePath = path.join(outputFileNamePDF + '.pdf');
          const pdfFile = fs.readFileSync(pdfFilePath);
          
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="${outputFileNamePDF}.pdf'"`);
          res.send(pdfFile);
      
          // Cleanup: Remove the uploaded TeX and PDF files
          /* fs.unlink(latexCodeTexFileDir, (err) => {
            if (err) {
              console.error(err);
            }
          });
          fs.unlink(pdfFilePath, (err) => {
            if (err) {
              console.error(err);
            }
          }); */ 
        } else {
          res.status(500).send('TeX compilation failed');
        }
        console.log('Your file has been sent!');
      });
      
    }
  });
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
