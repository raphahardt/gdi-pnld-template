import fs from "fs";
import path from "path";

export async function copiarRecursos(fromFolder, finalFolder) {
  await fs.promises.copyFile(path.resolve(fromFolder, 'resources/styles/base.css'), path.resolve(finalFolder, 'resources/styles/base.css'));
  await fs.promises.copyFile(path.resolve(fromFolder, 'resources/scripts/floating-ui.js'), path.resolve(finalFolder, 'resources/scripts/floating-ui.js'));
  await fs.promises.copyFile(path.resolve(fromFolder, 'resources/scripts/scripts.js'), path.resolve(finalFolder, 'resources/scripts/scripts.js'));
  await fs.promises.copyFile(path.resolve(fromFolder, 'resources/images/click-hand.png'), path.resolve(finalFolder, 'resources/images/click-hand.png'));
}

export async function criarHtml(fromFolder, finalFolder, titulo, bodyClass, conteudo) {
  let finalHtml = await fs.promises.readFile(path.resolve(fromFolder, '_template.html'), 'utf-8');

  conteudo = conteudo.replace(/\{titulo\}/g, titulo);

  finalHtml = finalHtml
  .replace(/\{titulo\}/g, titulo)
  .replace(/\{bodyclass\}/g, bodyClass)
  .replace(/\{conteudo\}/g, conteudo);

  await fs.promises.writeFile(path.resolve(finalFolder, 'index.html'), finalHtml);
}

export async function criarPastas(fromFolder, finalFolder, stylesBase = '') {
  await fs.promises.mkdir(finalFolder, { recursive: true });
  await fs.promises.mkdir(path.resolve(finalFolder, 'resources/images'), { recursive: true });
  await fs.promises.mkdir(path.resolve(finalFolder, 'resources/scripts'), { recursive: true });
  await fs.promises.mkdir(path.resolve(finalFolder, 'resources/styles'), { recursive: true });

  await copiarRecursos(fromFolder, finalFolder);

  if (!fs.existsSync(path.resolve(finalFolder, 'resources/styles/styles.css'))) {
    await fs.promises.writeFile(path.resolve(finalFolder, 'resources/styles/styles.css'), stylesBase);
  }
}