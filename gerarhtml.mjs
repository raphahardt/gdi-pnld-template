import inquirer from 'inquirer';
import path from 'path';
import fs from 'fs';
import { criarHtml, criarPastas } from "./_modulos/arqhtml.mjs";
import { gerarCarousel } from "./_modulos/carousel.mjs";
import { gerarInfMap } from "./_modulos/infmap.mjs";

const TEMPLATES = fs
.readdirSync(path.resolve(import.meta.dirname, 'resources'))
.filter((d) => d !== "base");

/**
 * @type {{nome: string, template: string}}
 */
const preinfos = await inquirer.prompt([
  {
    type: 'input',
    message: 'Qual vai ser o nome da pasta do projeto. Coloque somente o sufixo, o prefixo vai ser colocado automaticamente (exemplo: ART-INF3):',
    name: 'nome',
  },
  {
    type: 'list',
    choices: TEMPLATES.map((template) => ({
      name: template.toUpperCase(),
      value: template,
    })),
    message: 'Escolha o template (o nome vai ser parte do prefixo, exemplo: ESC-ART-INF3):',
    name: 'template',
  },
]);

if (!fs.existsSync(path.resolve(import.meta.dirname, 'materias', preinfos.template + ".txt"))) {
  console.error(`Template "${preinfos.template}" não encontrado em ${import.meta.dirname}/materias`);
  process.exit(1);
}
const materiasContent = fs.readFileSync(path.resolve(import.meta.dirname, 'materias', preinfos.template + ".txt"), 'utf-8');
const MATERIAS = materiasContent.split('\n').map(f => f.trim()).filter(f => f.length > 0);
/**
 * @type {{versao: string, mat: string, vertical: boolean, tipo: string, titulo: string}}
 */
const infos = await inquirer.prompt([
  {
    type: 'list',
    choices: [
      {name: "V1", value: "V1"},
      {name: "V2", value: "V2"},
      {name: "V3", value: "V3"},
      {name: "V4", value: "V4"},
    ],
    message: 'Qual versão tá sendo gerada?',
    name: 'versao',
    default: "V1"
  },
  {
    type: 'list',
    choices: MATERIAS.map((obj) => ({
      name: obj,
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

const bodyClass = `${infos.vertical ? 'vertical ' : ''}${infos.mat}`;
const nameTemplate = preinfos.template.toUpperCase();

const generateFolder = path.resolve(import.meta.dirname, 'projetos', `${infos.versao}-${nameTemplate}-${preinfos.nome}`);

let htmlInfo;
if (infos.tipo === "Carrossel") {
  htmlInfo = await gerarCarousel(generateFolder);
} else {
  htmlInfo = await gerarInfMap(generateFolder);
}

console.log("Gerando HTML...");

await criarPastas(preinfos.template, import.meta.dirname, generateFolder, htmlInfo.styles || '');
await criarHtml(import.meta.dirname, generateFolder, infos.titulo, bodyClass, htmlInfo.conteudo);

if (htmlInfo.copyFiles) {
  for (const file of htmlInfo.copyFiles) {
    await fs.promises.copyFile(file[0], file[1]);
  }
}

console.log(`HTML gerado com sucesso! Está na pasta ${generateFolder}`);
