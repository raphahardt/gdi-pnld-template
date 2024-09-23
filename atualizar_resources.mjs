import inquirer from 'inquirer';
import fileSelector from 'inquirer-file-selector';
import path from 'path';
import fs from 'fs';
import { copiarRecursos } from "./_modulos/arqhtml.mjs";

const filePath = await fileSelector({
  message: 'Selecione a pasta do projeto que vai atualizar os resources:',
  match: (file) => file.name === 'index.html',
  hideNonMatch: true,
})

const finalFolder = path.dirname(filePath);

if ((await fs.promises.readdir(path.resolve(finalFolder, 'resources'))).length === 0) {
  console.log('Essa pasta não tem resources para serem atualizados');
  process.exit(0);
}

const confirm = await inquirer.prompt({
  type: 'confirm',
  message: 'Deseja realmente atualizar os resources?',
  name: 'confirm',
});

if (!confirm.confirm) {
  console.log('Operação cancelada');
  process.exit(0);
}

await copiarRecursos(import.meta.dirname, finalFolder);

console.log('Resources atualizados');
