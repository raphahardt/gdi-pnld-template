import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import { criarHtml, criarPastas } from "./_modulos/arqhtml.mjs";
import { gerarCarousel } from "./_modulos/carousel.mjs";
import { gerarInfMap } from "./_modulos/infmap.mjs";

const MATERIAS = [
  {materia: 'ciencias'},
  {materia: 'geografia'},
  {materia: 'historia'},
  {materia: 'matematica'},
  {materia: 'portugues'},
  {materia: 'interdisciplinar'},
]

/**
 * @type {{nome: string, mat: {materia: string}, vertical: boolean, tipo: string, titulo: string}}
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
      name: `${obj.materia}`,
      value: obj,
    })),
    message: 'Escolha a matéria:',
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
  },
  {
    type: 'input',
    message: 'Qual o título:',
    name: 'titulo',
  },
]);

const bodyClass = `${infos.vertical ? 'vertical ' : ''}${infos.mat.materia}`;

const generateFolder = path.resolve(import.meta.dirname, 'projetos', `V1-PNLD2027-ESC-${infos.nome}`);

let htmlInfo;
if (infos.tipo === "Carrossel") {
  htmlInfo = await gerarCarousel(generateFolder);
} else {
  htmlInfo = await gerarInfMap(generateFolder);
}

console.log("Gerando HTML...");

await criarPastas(import.meta.dirname, generateFolder, htmlInfo.styles || '');
await criarHtml(import.meta.dirname, generateFolder, infos.titulo, bodyClass, htmlInfo.conteudo);

if (htmlInfo.copyFiles) {
  for (const file of htmlInfo.copyFiles) {
    await fs.promises.copyFile(file[0], file[1]);
  }
}

console.log(`HTML gerado com sucesso! Está na pasta ${generateFolder}`);
