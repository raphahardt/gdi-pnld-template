import inquirer from 'inquirer';
import fileSelector from 'inquirer-file-selector';
import path from 'path';
import fs from 'fs';

const STYLES = `
[data-slide] {
    position: relative;
}
.slideImagem {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.legenda {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    background-color: white;
    color: black;
    padding: 10px;
    box-sizing: border-box;
}
.tituloPrincipal {
    position: absolute;
    left: 50%;
    top: 20px;
    transform: translateX(-50%);
}
`

const CONTEUDO_TEMPLATE = `<div data-slides>
        {slides}
    </div>`;

const SLIDE_TEMPLATE = `
        <div data-slide>
            {image}
            {legend}
        </div>`;

const SLIDE_TEMPLATE_FIRST = `
        <div data-slide>
             <h1 class="tituloPrincipal">{titulo}</h1>

            {image}
            {legend}
        </div>`

const IMAGE_TEMPLATE = `<img src="{src}" class="slideImagem" alt=" "{creditos}>`;

const LEGEND_TEMPLATE = `<div class="legenda">{texto}</div>`;

export async function gerarCarousel(finalFolder) {
  const filePath = await fileSelector({
    message: 'Selecione a pasta de imagens (escolha qualquer imagem):',
    match: (file) => !!file.name.match(/\.(png|jpe?g|gif)$/i),
    hideNonMatch: true,
  })

  const selectedPath = path.dirname(filePath);

  const allFiles = await fs.promises.readdir(selectedPath);

  const selectedFiles = await inquirer.prompt({
    type: 'checkbox',
    choices: allFiles,
    message: 'Selecione as imagens que vão virar slides:',
    name: 'files',
  });

  if (selectedFiles.files.length === 0) {
    throw new Error('Nenhuma imagem selecionada');
  }

  const questionsSlidesInfo = [];
  for (let f = 0; f < selectedFiles.files.length; f++) {
    const file = selectedFiles.files[f];

    questionsSlidesInfo.push({
      type: 'input',
      message: `Legenda para ${file}:`,
      name: `legenda${f}`,
    });
  }
  for (let f = 0; f < selectedFiles.files.length; f++) {
    const file = selectedFiles.files[f];

    questionsSlidesInfo.push({
      type: 'input',
      message: `Créditos para ${file}:`,
      name: `creditos${f}`,
    });
  }

  const slidesInfo = await inquirer.prompt(questionsSlidesInfo);
  const slides = selectedFiles.files.map((file, index) => {
    const creditos = slidesInfo[`creditos${index}`] ? (` data-creditos="${slidesInfo[`creditos${index}`]}"` + (slidesInfo[`legenda${index}`] ? ' data-creditos-posicao="topright"' : '')) : '';

    const image = IMAGE_TEMPLATE
    .replace('{src}', `./resources/images/${file}`)
    .replace('{creditos}', creditos);

    const legend = slidesInfo[`legenda${index}`] ?
      LEGEND_TEMPLATE.replace('{texto}', slidesInfo[`legenda${index}`]) : '';

    return (index === 0 ? SLIDE_TEMPLATE_FIRST : SLIDE_TEMPLATE)
    .replace('{image}', image)
    .replace('{legend}', legend);
  });

  return {
    styles: STYLES,
    conteudo: CONTEUDO_TEMPLATE.replace('{slides}', slides.join('\n')),
    copyFiles: selectedFiles.files.map((file) => (
      [path.resolve(selectedPath, file), path.resolve(finalFolder, 'resources/images', file)]
    )),
  }
}