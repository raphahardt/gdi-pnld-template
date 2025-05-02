import inquirer from 'inquirer';
import fileSelector from 'inquirer-file-selector';
import path from "path";

const CONTEUDO_TEMPLATE = `
    <div id="menu">
        <div class="menu-titulo">Menu</div>
        <ul data-menu></ul>
    </div>

    <h1 class="titulo-principal">{titulo}</h1>

    {clicaveis}
    
    {bottom}
`;

const POPUP_TEMPLATE = `
    <div id="popup{index}" data-popup class="center">
        
    </div>
`;

const TOOLTIP_TEMPLATE = `
    <div id="tooltip{index}" data-tooltip class="tooltipHover">
    
    </div>
`;

const IMAGEM_TEMPLATE = `<img src="./resources/images/{imageName}" alt=" " class="imagemFundo" />`;

const CLICAVEIS_TEMPLATE = `<div data-zoom-imagem class="container">
        {imagem}
        
        {pontos}
    </div>`;

const PONTO_TEMPLATE = `<div class="ponto p{index}" data-click="{titulo}"{attrs}></div>`;

export async function gerarInfMap(finalFolder) {
  const copyFiles = [];
  let STYLES = '';
  const clicaveis = [];

  STYLES += `
.container {
    position: relative;
    width: 100%;
    height: 100%;
}
`;

  const backgroundImage = await inquirer.prompt([
    {
      type: 'confirm',
      message: 'Vai ter uma imagem fixa de fundo?',
      name: 'hasImage',
    },
    {
      type: 'confirm',
      message: 'Ela vai ocupar 100%?',
      name: 'imageFull',
    },
    {
      type: 'input',
      message: 'Tem crédito?',
      instructions: 'Deixe vazio se não tiver',
      name: 'credits',
    },
  ]);

  if (backgroundImage.hasImage) {
    const image = await fileSelector({
      message: 'Selecione a imagem de fundo:',
      match: (file) => !!file.name.match(/\.(png|jpe?g|gif)$/i),
      hideNonMatch: true,
    });

    backgroundImage.imageName = path.basename(image);
    copyFiles.push([image, path.resolve(finalFolder, 'resources/images', backgroundImage.imageName)]);

    if (backgroundImage.imageFull) {
      STYLES += `
.imagemFundo {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
      `;
    }
  }

  const clicaveisInfo = await inquirer.prompt([
    {
      type: 'number',
      message: 'Tem elementos clicáveis? Quantos',
      instructions: 'Digite 0 se não tiver',
      name: 'count',
    },
  ]);

  if (clicaveisInfo.count) {
    STYLES += `
.ponto {
    position: absolute;
}
`;
    for (let c = 0; c < clicaveisInfo.count; c++) {
      const clicavel = await inquirer.prompt([
        {
          type: 'input',
          message: `[Clicável ${c + 1}] - Qual vai ser o título do elemento clicável?`,
          name: 'titulo',
        },
        {
          type: 'confirm',
          message: 'Vai abrir um popup?',
          name: 'popup',
        },
        {
          type: 'confirm',
          message: 'Vai ter algum hover (tooltip)?',
          name: 'hover',
          default: false,
        },
        {
          type: 'confirm',
          message: 'Vai dar zoom no background (na imagem ou numa div de fundo)?',
          name: 'zoom',
          default: false,
        },
      ]);

      clicaveis.push(clicavel);

      STYLES += `
.ponto.p${c + 1} {
    left: ${100 + (20 * c)}px;
    top: 100px;
}
`;
    }
  }

  // alguns styles
  if (clicaveis.find((c) => c.hover)) {
    STYLES += `
.tooltipHover {
    position: absolute;
    background-color: white;
    padding: 5px;
    width: fit-content;
    max-width: 500px;
}
`;
  }

  const imagemHtml = IMAGEM_TEMPLATE.replace('{imageName}', backgroundImage.imageName || '');
  const pontosHtml = clicaveis.map((c, i) => {
    const attrs = [];
    if (c.popup) {
      attrs.push(`data-popup-open="popup${i + 1}"`);
    }
    if (c.hover) {
      attrs.push(`data-tooltip-open="tooltip${i + 1}"`);
    }
    if (c.zoom) {
      attrs.push('data-zoom="100,100,1.3"');
    }

    return PONTO_TEMPLATE
    .replace('{index}', String(i + 1))
    .replace('{titulo}', c.titulo)
    .replace('{attrs}', attrs.length ? ` ${attrs.join(' ')}` : '');

  }).join('\n        ');

  const clicaveisHtml = CLICAVEIS_TEMPLATE
  .replace('{imagem}', imagemHtml)
  .replace('{pontos}', pontosHtml);

  const popupsHtml = clicaveis.map((c, i) => {
    if (c.popup) {
      return POPUP_TEMPLATE.replace('{index}', String(i + 1));
    }
    return '';
  }).join('\n    ');

  const tooltipsHtml = clicaveis.map((c, i) => {
    if (c.hover) {
      return TOOLTIP_TEMPLATE.replace('{index}', String(i + 1));
    }
    return '';
  }).join('\n    ');

  const bottomHtml = `
        ${popupsHtml}
        ${tooltipsHtml}

`;

  const conteudoHtml = CONTEUDO_TEMPLATE
  .replace('{clicaveis}', clicaveisHtml)
  .replace('{bottom}', bottomHtml);

  return {
    styles: STYLES,
    conteudo: conteudoHtml,
    copyFiles,
  }
}