import fs from "fs";
import path from "path";

export async function copiarRecursos(template, fromFolder, finalFolder) {
  if (!fs.existsSync(path.resolve(fromFolder, 'resources', 'base'))) {
    throw new Error(`Template "base" não encontrado em ${fromFolder}/resources`);
  }

  if (!fs.existsSync(path.resolve(fromFolder, 'resources', template))) {
    throw new Error(`Template "${template}" não encontrado em ${fromFolder}/resources`);
  }

  async function _copy(file) {
    const baseExists = fs.existsSync(path.resolve(fromFolder, 'resources', 'base', file));
    const templateExists = fs.existsSync(path.resolve(fromFolder, 'resources', template, file));

    if (baseExists) {
      await fs.promises.copyFile(
        path.resolve(fromFolder, 'resources', 'base', file),
        path.resolve(finalFolder, 'resources', file)
      );
    }

    if (templateExists) {
      await fs.promises.copyFile(
        path.resolve(fromFolder, 'resources', template, file),
        path.resolve(finalFolder, 'resources', file)
      );
    }
  }

  await _copy('styles/base.css');
  await _copy('scripts/floating-ui.js');
  await _copy('scripts/scripts.js');
  if (fs.existsSync(path.resolve(fromFolder, 'resources', template, 'images'))) {
    for (const file of await fs.promises.readdir(path.resolve(fromFolder, 'resources', template, 'images'))) {
      await _copy(`images/${file}`);
    }
  }
  if (fs.existsSync(path.resolve(fromFolder, 'resources', template, 'fonts'))) {
    await fs.promises.mkdir(path.resolve(finalFolder, 'resources/fonts'), { recursive: true });
    for (const file of await fs.promises.readdir(path.resolve(fromFolder, 'resources', template, 'fonts'))) {
      await _copy(`fonts/${file}`);
    }
  }
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

export async function criarPastas(template, fromFolder, finalFolder, stylesBase = '') {
  await fs.promises.mkdir(finalFolder, { recursive: true });
  await fs.promises.mkdir(path.resolve(finalFolder, 'resources/images'), { recursive: true });
  await fs.promises.mkdir(path.resolve(finalFolder, 'resources/scripts'), { recursive: true });
  await fs.promises.mkdir(path.resolve(finalFolder, 'resources/styles'), { recursive: true });

  await copiarRecursos(template, fromFolder, finalFolder);

  if (!fs.existsSync(path.resolve(finalFolder, 'resources/styles/styles.css'))) {
    await fs.promises.writeFile(path.resolve(finalFolder, 'resources/styles/styles.css'), stylesBase);
  }
}