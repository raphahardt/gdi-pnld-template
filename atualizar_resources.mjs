import fs from "fs";
import inquirer from 'inquirer';
import path from "path";

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

const TEMPLATES = fs
.readdirSync(path.resolve(import.meta.dirname, 'resources'))
.filter((d) => d !== "base");

/**
 * @type {{confirm: boolean, template: string}}
 */
const confirm = await inquirer.prompt([
  {
    type: 'confirm',
    message: 'Deseja realmente atualizar os resources?',
    name: 'confirm',
  },
  {
    type: 'list',
    choices: TEMPLATES.map((template) => ({
      name: template.toUpperCase(),
      value: template,
    })),
    message: 'Escolha o template:',
    name: 'template',
  },
]);

if (!confirm.confirm) {
  console.log('Operação cancelada');
  process.exit(0);
}

let i = 0;
for await (const folder of iterateFolders(finalFolder)) {
  if (!folder.match(new RegExp("-" + confirm.template + "-", "i"))) {
    continue; // Ignora pastas que não são desse template
  }
  await copiarRecursos(confirm.template, import.meta.dirname, folder);
  console.log('Resources atualizados: ' + folder);
  i++;
}

if (i === 0) {
  console.log('Nenhum OED encontrado');
}