import inquirer from 'inquirer';
import fileSelector from 'inquirer-file-selector';
import path from 'path';
import fs from 'fs';
import timesnap from 'timesnap';
import { PDFDocument, rgb } from 'pdf-lib';

const indexPath = await fileSelector({
  message: 'Selecione o arquivo index.html que vc quer gerar o PDF:',
  match: (file) => file.name === 'index.html',
  hideNonMatch: true,
});

const htmlCode = await fs.promises.readFile(indexPath, 'utf-8');

if (!htmlCode) {
  console.log('Arquivo vazio');
  process.exit(0);
}

const selectedPath = path.dirname(indexPath);
const isVertical = htmlCode.match(/vertical/);

const clickables = htmlCode.match(/\b(data-click|data-slide)\b/g);

const timesnapOptions = {
  viewport: {
    width: isVertical ? 720 : 1280,
    height: isVertical ? 1280 : 720
  },
  selector: '.principal',
  frames: 1,
  startDelay: 0,
  launchArguments: ['--disable-lazy-loading'],
  quiet: true,
  // launchArguments: ['--wm-window-animations-disabled', '--disable-lazy-loading'],
  outputDirectory: path.resolve(selectedPath, 'pdf'),
};

await timesnap({
  ...timesnapOptions,
  url: `file:///${indexPath}`,
  outputPattern: '001.png',
});

for (let i = 0; i < clickables.length; i++) {
  const paddedIndex = String(i + 2).padStart(3, '0');

  await timesnap({
    ...timesnapOptions,
    url: `file:///${indexPath}#click${i + 1}`,
    outputPattern: `${paddedIndex}.png`,
    startDelay: 1,
    // launchArguments: ['--wm-window-animations-disabled', '--disable-lazy-loading'],
    preparePage: async (page) => {
      await page.evaluate(async () => {
        // console.log(document.querySelector('[data-slide].ativo').innerText);
        const selectors = Array.from(document.querySelectorAll("img"));
        await Promise.all(selectors.map(img => {
          // console.log(img.src, img.complete);
          if (img.complete) return;
          return new Promise((resolve, reject) => {
            img.addEventListener('load', resolve);
            img.addEventListener('error', reject);
          });
        }));
      })
    },
  });
}

await timesnap({
  ...timesnapOptions,
  url: `file:///${indexPath}#m`,
  outputPattern: `999.png`,
});

console.log("Gerado as imagens");

// gerando o pdf
const pdfPath = path.resolve(selectedPath, path.basename(selectedPath) + '.pdf');
const pdfDoc = await PDFDocument.create();

const pdfImages = await fs.promises.readdir(path.resolve(selectedPath, 'pdf'));

for (const pdfImage of pdfImages) {
  const pdfImagePath = path.resolve(selectedPath, 'pdf', pdfImage);

  const image = await fs.promises.readFile(pdfImagePath);
  const imageEmbed = await pdfDoc.embedPng(image);

  const page = pdfDoc.addPage([isVertical ? 720 : 1280, isVertical ? 1280 : 720]);

  const { width, height } = imageEmbed.scaleToFit(
    page.getWidth(),
    page.getHeight(),
  );

  page.drawImage(imageEmbed, {
    x: page.getWidth() / 2 - width / 2, // Center the image horizontally.
    y: page.getHeight() / 2 - height / 2, // Center the image vertically.
    width,
    height,
    color: rgb(0, 0, 0), // Set the image color to black.
  });
}

// salva como bytes, dps cria o arquivo na mesma pasta
const pdfBytes = await pdfDoc.save();
await fs.promises.writeFile(pdfPath, pdfBytes);

console.log("PDF gerado");

// não precisa mais da pasta de imagens
await fs.promises.rm(path.resolve(selectedPath, 'pdf'), { recursive: true });
