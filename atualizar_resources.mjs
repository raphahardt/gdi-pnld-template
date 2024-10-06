import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import { copiarRecursos } from "./_modulos/arqhtml.mjs";
import folderPrompt from "./_modulos/folderPrompt.mjs";
import { getLastFolder, setLastFolder } from "./_modulos/lastFolder.mjs";

function* iterateFolders(folder) {
  if (fs.existsSync(path.join(folder, "atualizar_resources.mjs"))) {
    return;
  }

  if (fs.existsSync(path.join(folder, "resources")) && fs.existsSync(path.join(folder, "index.html"))) {
    const html = fs.readFileSync(path.join(folder, "index.html"), { encoding: "utf8" });

    if (html.includes("/floating-ui.js")) {
      yield folder;
      return;
    }
  }

  const folders = fs.readdirSync(folder);

  for (const f of folders) {
    const fullPath = path.join(folder, f);

    if (fs.statSync(fullPath).isDirectory()) {
      if (fs.existsSync(path.join(fullPath, "atualizar_resources.mjs"))) {
        continue;
      }

      if (fs.existsSync(path.join(fullPath, "resources")) && fs.existsSync(path.join(fullPath, "index.html"))) {
        const html = fs.readFileSync(path.join(fullPath, "index.html"), { encoding: "utf8" });

        if (html.includes("/floating-ui.js")) {
          yield fullPath;
        }
      }

      yield* iterateFolders(fullPath);
    }
  }
}

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