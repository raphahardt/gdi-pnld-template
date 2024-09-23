import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import { criarHtml, criarPastas } from "./_modulos/arqhtml.mjs";
import { gerarCarousel } from "./_modulos/carousel.mjs";
import { gerarInfMap } from "./_modulos/infmap.mjs";

const MATERIAS = [
  {area: 'chs', materia: 'filosofia'},
  {area: 'chs', materia: 'geografia'},
  {area: 'chs', materia: 'historia'},
  {area: 'chs', materia: 'sociologia'},
  {area: 'cnt', materia: 'biologia'},
  {area: 'cnt', materia: 'fisica'},
  {area: 'cnt', materia: 'quimica'},
  {area: 'lgg', materia: 'artes'},
  {area: 'lgg', materia: 'portugues'},
  {area: 'lgg', materia: 'redacao'},
  {area: 'mat', materia: 'matematica'},
]

/**
 * @type {{nome: string, mat: {area: string, materia: string}, vertical: boolean, tipo: string}}
 */
const infos = await inquirer.prompt([
  {
    type: 'input',
    message: 'Qual vai ser o nome da pasta (exemplo: ART-INF3):',
    name: 'nome',
  },
  {
    type: 'list',
    choices: MATERIAS.map((obj) => ({
      name: `${obj.area} - ${obj.materia}`,
      value: obj,
    })),
    message: 'Escolha a área e a matéria:',
    name: 'mat',
  },
  {
    type: 'confirm',
    message: 'É vertical?',
    name: 'vertical',
    default: false,
  },
  {
    type: 'list',
    choices: ['Infográfico', 'Mapa', 'Carrossel'],
    message: 'Escolha o tipo de html:',
    name: 'tipo',
  }
]);

const bodyClass = `${infos.vertical ? 'vertical ' : ''}${infos.mat.area} ${infos.mat.materia}`;

const generateFolder = path.resolve(import.meta.dirname, 'projetos', `V1-PNLD2026-ESC-${infos.nome}`);

let htmlInfo;
if (infos.tipo === "Carrossel") {
  htmlInfo = await gerarCarousel(generateFolder);
} else {
  htmlInfo = await gerarInfMap(generateFolder);
}

console.log("Gerando HTML...");

await criarPastas(import.meta.dirname, generateFolder, htmlInfo.styles || '');
await criarHtml(import.meta.dirname, generateFolder, infos.tipo, bodyClass, htmlInfo.conteudo);

if (htmlInfo.copyFiles) {
  for (const file of htmlInfo.copyFiles) {
    await fs.promises.copyFile(file[0], file[1]);
  }
}

console.log(`HTML gerado com sucesso! Está na pasta ${generateFolder}`);
