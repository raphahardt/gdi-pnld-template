import path from 'path';
import fs from 'fs';
import timesnap from 'timesnap';
import { PDFDocument, rgb } from 'pdf-lib';
import folderPrompt from "./_modulos/folderPrompt.mjs";
import { getLastFolder, iterateFolders, setLastFolder } from "./_modulos/lastFolder.mjs";

const lastFolder = getLastFolder();

const selectedPath = await folderPrompt({
  message: "Selecione a pasta do projeto (ou dos projetos) que vc quer gerar o PDF:",
  startFolder: lastFolder,
});

if (!selectedPath) {
  console.log('Operação cancelada');
  process.exit(0);
}

setLastFolder(selectedPath);

let i = 0;
for await (const folder of iterateFolders(selectedPath)) {
  console.log('Gerando PDF para: ' + folder);

  const indexPath = path.resolve(folder, 'index.html');

  const htmlCode = await fs.promises.readFile(indexPath, 'utf-8');

  if (!htmlCode) {
    console.log('Arquivo vazio');
    continue;
  }

  const isVertical = htmlCode.match(/class="vertical/);
  const isCarousel = htmlCode.match(/data-slide/);

  const clickables = htmlCode.match(/\b(data-click(-hidden)?|data-slide)\b/g) ?? [];

  if (!(await fs.promises.readFile(path.resolve(folder, 'resources/scripts/scripts.js'), 'utf-8')).match(/if \(hash\) \{/)) {
    console.log('Atualize primeiro os resources usando o comando "node atualizar_resources.mjs"');
    continue;
  }

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
    outputDirectory: path.resolve(folder, 'pdf'),
  };

  console.log("Gerando as imagens...");

  await timesnap({
    ...timesnapOptions,
    url: `file:///${indexPath}`,
    outputPattern: '001.png',
  });
  console.log("Inicial gerado");

  for (let i = isCarousel ? 1 : 0; i < clickables.length; i++) {
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

    console.log(`Link ${i + 1} gerado`);
  }

  console.log("Imagens geradas");

  console.log("Gerando PDF...");

// gerando o pdf
  const pdfPath = path.resolve(folder, path.basename(folder) + '.pdf');
  const pdfDoc = await PDFDocument.create();

  const pdfImages = await fs.promises.readdir(path.resolve(folder, 'pdf'));

  for (const pdfImage of pdfImages) {
    const pdfImagePath = path.resolve(folder, 'pdf', pdfImage);

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
  try {
    await fs.promises.rm(path.resolve(folder, 'pdf'), { recursive: true });
  } catch (e) {
    console.log(`Erro ao remover a pasta ${path.resolve(folder, 'pdf')}: ${e}. Remova manualmente.`);
  }
  i++;
}
