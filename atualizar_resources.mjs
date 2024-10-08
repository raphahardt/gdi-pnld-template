import inquirer from 'inquirer';

import { copiarRecursos } from "./_modulos/arqhtml.mjs";
import folderPrompt from "./_modulos/folderPrompt.mjs";
import { getLastFolder, setLastFolder, iterateFolders } from "./_modulos/lastFolder.mjs";

const lastFolder = getLastFolder();

const finalFolder = await folderPrompt({
  message: "Selecione a pasta do projeto que vai atualizar os resources:",
  startFolder: lastFolder,
});

if (!finalFolder) {
  console.log('Operação cancelada');
  process.exit(0);
}

setLastFolder(finalFolder);

const confirm = await inquirer.prompt({
  type: 'confirm',
  message: 'Deseja realmente atualizar os resources?',
  name: 'confirm',
});

if (!confirm.confirm) {
  console.log('Operação cancelada');
  process.exit(0);
}

let i = 0;
for await (const folder of iterateFolders(finalFolder)) {
  await copiarRecursos(import.meta.dirname, folder);
  console.log('Resources atualizados: ' + folder);
  i++;
}

if (i === 0) {
  console.log('Nenhum OED encontrado');
}