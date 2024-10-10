import path from 'path';
import fs from 'fs';
import { parse } from "node-html-parser";

import folderPrompt from "./_modulos/folderPrompt.mjs";
import { getLastFolder, iterateFolders, setLastFolder } from "./_modulos/lastFolder.mjs";

const lastFolder = getLastFolder();

const selectedPath = await folderPrompt({
  message: "bleh:",
  startFolder: lastFolder,
});

if (!selectedPath) {
  console.log('Operação cancelada');
  process.exit(0);
}

setLastFolder(selectedPath);

let i = 0;
for await (const folder of iterateFolders(selectedPath)) {
  //console.log('atualizando car: ' + folder);

  const indexPath = path.resolve(folder, 'index.html');

  const htmlCode = await fs.promises.readFile(indexPath, 'utf-8');

  if (!htmlCode) {
    console.log('Arquivo vazio');
    continue;
  }

  const htmlParse = parse(htmlCode);

  const titulo = htmlParse.querySelector('title').text;

  console.log(folder, titulo)

  // const menu = htmlParse.querySelector('#menu');
  //
  // if (menu) {
  //   console.log('Removendo menu');
  //   menu.remove();
  // }
  //
  // const principal = htmlParse.querySelector('.principal');
  // const h1 = principal.querySelector('h1.tituloPrincipal');
  //
  // if (!h1) {
  //   console.log('Sem h1.tituloPrincipal');
  //
  //   principal.insertAdjacentHTML('afterbegin', `\n    <h1 class="tituloPrincipal">${titulo}</h1>`);
  // }
  //
  // if (h1 && h1.closest('[data-slide]')) {
  //   console.log('Slide com titulo');
  //
  //   h1.remove();
  // }

  const stylesCode = await fs.promises.readFile(path.join(folder, 'resources/styles/styles.css'), 'utf-8');

  if (!stylesCode.match(/z\-index\: 1/)) {
    console.log('Sem z-index no styles.css');

    const s = `.tituloPrincipal {
    position: absolute;
    left: 50%;
    top: 20px;
    transform: translateX(-50%);
    text-align: center;
    width: fit-content;
}`

    const s2 = `.tituloPrincipal {
    position: absolute;
    left: 50%;
    top: 20px;
    transform: translateX(-50%);
    text-align: center;
    width: fit-content;
    z-index: 1;
}`

    await fs.promises.writeFile(path.join(folder, 'resources/styles/styles.css'), stylesCode.replace(s, s2), 'utf-8');
  }

  const newHtml = htmlParse.toString();
  await fs.promises.writeFile(indexPath, newHtml, 'utf-8');

  i++;
}
