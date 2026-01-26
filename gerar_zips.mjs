import fs from "fs";
import inquirer from 'inquirer';
import path from "path";
import AdmZip from "adm-zip";
import sharp from "sharp";

import { copiarRecursos } from "./_modulos/arqhtml.mjs";
import folderPrompt from "./_modulos/folderPrompt.mjs";
import { getLastFolder, setLastFolder, iterateFolders } from "./_modulos/lastFolder.mjs";

const lastFolder = getLastFolder();

const finalFolder = await folderPrompt({
  message: "Selecione a pasta do projeto que vai criar os zips:",
  startFolder: lastFolder,
});

if (!finalFolder) {
  console.log('Operação cancelada');
  process.exit(0);
}

setLastFolder(finalFolder);

let i = 0;
for await (const folder of iterateFolders(finalFolder)) {
  // execute sharp command on the folder to optimize all the images inside it
  const imagesFolder = path.join(folder, 'resources', 'images');
  if (fs.existsSync(imagesFolder)) {
    const imageFiles = fs.readdirSync(imagesFolder);
    for (const imageFile of imageFiles) {
      const imagePath = path.join(imagesFolder, imageFile);
      const ext = path.extname(imageFile).toLowerCase();
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        try {
          const image = sharp(imagePath);
          const metadata = await image.metadata();
          if (metadata.width > 1200) {
            await image.resize(1200).toFile(imagePath + '.opt');
            fs.renameSync(imagePath + '.opt', imagePath);
            console.log(`Imagem otimizada: ${imagePath}`);
          }
        } catch (err) {
          console.error(`Erro ao otimizar imagem ${imagePath}:`, err);
        }
      }
    }
  }

  const zip = new AdmZip();
  zip.addLocalFolder(folder);
  zip.writeZip(path.join(finalFolder, `${path.basename(folder)}.zip`));
  console.log('Zip criado: ' + folder);
  i++;
}

if (i === 0) {
  console.log('Nenhum OED encontrado');
}