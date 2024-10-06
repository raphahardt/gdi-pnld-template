const {computePosition, offset, flip, shift, autoUpdate} = window.FloatingUIDOM;

function throwError(message) { alert(message); throw new Error(message); }

// checagens
if (!document.querySelector('.principal')) {
  throwError('O elemento com a classe "principal" é obrigatório');
}

const isVertical = document.body.classList.contains("vertical");
const proportion = { ho: isVertical ? 720 : 1280, ve: isVertical ? 1280 : 720 };
const principalElem = document.querySelector(".principal");

const resizeObserver = new ResizeObserver((entries) => {
  const rect = entries[0].target.getBoundingClientRect();
  const mainRect = { width: proportion.ho, height: proportion.ve };

  const scale = Math.min(rect.width / mainRect.width, rect.height / mainRect.height);
  const xDiff = mainRect.width - rect.width;
  const translateX = xDiff > 0 && scale !== 0 ? -xDiff / 2 / scale : 0;
  const yDiff = mainRect.height - rect.height;
  const translateY = yDiff > 0 && scale !== 0 ? -yDiff / 2 / scale : 0;

  Object.assign(principalElem.style, {
    width: `${mainRect.width}px`,
    height: `${mainRect.height}px`,
    transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
  });
});

resizeObserver.observe(document.body);

// menu
const menu = document.getElementById("menu");

if (menu) {
  menu.classList.add("open");
  // menu.addEventListener("click", (event) => {
  //   if (event.target === menu) {
  //     menu.classList.toggle("open");
  //   }
  // });
}

const clickables = new Map();

document.querySelectorAll("[data-click]").forEach((item) => {
  // faz com que o item seja focável
  //item.tabIndex = 0;
  let action;
  if (item.dataset.popupOpen) {
    action = { action: "popup", id: item.dataset.popupOpen };
  }
  if (item.dataset.tooltipOpen) {
    action = { action: "tooltip", id: item.dataset.tooltipOpen };
  }
  clickables.set(`${action.action}${action.id}`, { menuItems: [], action });

  document.querySelectorAll("ul[data-menu]").forEach((menu) => {
    const menuItemLi = document.createElement("li");
    const menuItem = document.createElement("button");
    menuItem.classList.add("menu-item");
    menuItem.classList.add(`m-${action.action}${action.id}`);
    if (item.dataset.click.match(/<span.*<\/span>/)) {
      menuItem.innerHTML = item.dataset.click.replace(/<(?!\/?span).*?>/g, ""); // retira todas as tags q não sejam span
    } else {
      menuItem.innerText = item.dataset.click;
    }

    clickables.get(`${action.action}${action.id}`).menuItems.push(menuItem);

    menuItem.addEventListener("click", (event) => {
      // menu.querySelectorAll("button.active").forEach((c) => {
      //   c.classList.remove("active");
      // });
      // menuItem.classList.add("active");
      if (action.action === "popup") {
        const openedPopup = document.querySelector('[data-popup].open');
        if (openedPopup) {
          closePopup(openedPopup);
        }
      }
      item.dispatchEvent(new Event("click"));
    });

    menuItemLi.append(menuItem);
    menu.append(menuItemLi);
  });
});

// creditos
function getContainerCreditos(item) {
  if (item.tagName === "DIV") {
    if (item.style.position !== "absolute" && item.style.position !== "fixed") {
      item.style.position = "relative";
    }
    return item;
  }

  const creditosContainer = document.createElement("div");
  const styles = window.getComputedStyle(item);

  Object.assign(creditosContainer.style, {
    float: styles.float,
    clear: styles.clear,
    width: styles.width,
    height: styles.height,
    margin: styles.margin,
    position: styles.position !== "static" ? styles.position : "relative",
    ...(styles.position !== "static" ? {
      top: styles.top,
      right: styles.right,
      bottom: styles.bottom,
      left: styles.left,
    } : {}),
    zIndex: styles.zIndex,
  })
  item.parentNode.insertBefore(creditosContainer, item);
  creditosContainer.appendChild(item);

  return creditosContainer;
}
document.querySelectorAll("[data-creditos]").forEach((item) => {
  const creditosContainer = getContainerCreditos(item);

  const creditos = document.createElement("div");
  creditos.classList.add("creditos");
  creditos.innerText = item.dataset.creditos;

  if (item.dataset.creditosPosicao) {
    switch (item.dataset.creditosPosicao) {
      case "bottomright":
      case "bottomleft":
      case "topright":
      case "topleft":
        creditos.classList.add(item.dataset.creditosPosicao);
        break;
      default:
        throwError('O valor do atributo "data-creditos-posicao" deve ser "bottomright", "bottomleft", "topright" ou "topleft"');
    }
  }

  creditosContainer.appendChild(creditos);
});

// detecção dos slides
document.querySelectorAll("[data-slides]").forEach((slides) => {
  const firstSlide = slides.querySelector("[data-slide]");
  const lastSlide = slides.querySelector("[data-slide]:last-child");
  const rightElem = document.createElement("button");
  const leftElem = document.createElement("button");
  rightElem.classList.add("slide-right");
  leftElem.classList.add("slide-left");
  rightElem.innerText = "❯";
  leftElem.innerText = "❮";

  slides.appendChild(rightElem);
  slides.appendChild(leftElem);

  if (firstSlide) {
    firstSlide.classList.add("ativo");
  }

  rightElem.addEventListener("click", (event) => {
    const nextSlide = slides.querySelector(".ativo + [data-slide]");

    if (nextSlide) {
      slides.querySelector(".ativo").classList.remove("ativo");
      nextSlide.classList.add("ativo");
    } else {
      slides.querySelector(".ativo").classList.remove("ativo");
      firstSlide.classList.add("ativo");
    }

    // força fechar o menu
    menu.classList.remove("open");
  });

  leftElem.addEventListener("click", (event) => {
    const allSlides = slides.querySelectorAll("[data-slide]");
    const prevSlide = slides.querySelector(".ativo") === firstSlide ? lastSlide : allSlides[Array.from(allSlides).indexOf(slides.querySelector(".ativo")) - 1];

    if (prevSlide) {
      slides.querySelector(".ativo").classList.remove("ativo");
      prevSlide.classList.add("ativo");
    } else {
      slides.querySelector(".ativo").classList.remove("ativo");
      lastSlide.classList.add("ativo");
    }

    // força fechar o menu
    menu.classList.remove("open");
  });

  document.querySelectorAll("ul[data-menu]").forEach((menu) => {
    const allSlides = slides.querySelectorAll("[data-slide]");

    allSlides.forEach((slid, index) => {
      const menuItemLi = document.createElement("li");
      const menuItem = document.createElement("button");
      menuItem.classList.add("menu-item");
      menuItem.innerText = `Slide ${index + 1}`;
      menuItem.addEventListener("click", (event) => {
        slides.querySelector(".ativo").classList.remove("ativo");
        slid.classList.add("ativo");
      });

      menuItemLi.append(menuItem);
      menu.append(menuItemLi);
    });
  });
});

if (document.querySelector("[data-slides]")) {
  document.body.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") {
      document.querySelector(".slide-right").click();
    } else if (event.key === "ArrowLeft") {
      document.querySelector(".slide-left").click();
    }
  });
}

// detecção dos acordeões
function showCollapse(handle, content) {
  content.classList.add("open");
  handle.setAttribute('aria-expanded', 'true');
  content.removeAttribute('hidden');
}
function hideCollapse(handle, content) {
  content.classList.remove("open");
  handle.setAttribute('aria-expanded', 'false');
  content.setAttribute('hidden', 'true');
}
document.querySelectorAll('[data-collapse-open]').forEach((handle) => {
  const content = document.querySelector("#" + handle.dataset.collapseOpen);
  handle.setAttribute('aria-expanded', 'false');
  handle.setAttribute('aria-controls', content.id);
  content.setAttribute('hidden', 'true');

  handle.addEventListener('click', () => {
    const isOpen = handle.getAttribute('aria-expanded') === 'true';

    if (isOpen) {
      hideCollapse(handle, content);
    } else {
      const group = handle.closest('[data-collapse-grupo]');
      if (group) {
        group.querySelectorAll('[data-collapse]').forEach((other) => {
          const handleOther = document.querySelector(`[data-collapse-open="${other.id}"]`);
          hideCollapse(handleOther, other);
        });
      }
      showCollapse(handle, content);
    }
  });
});

// detecção dos popups
const backdrop = document.createElement('div');
backdrop.classList.add('backdrop');
document.querySelector('.principal').prepend(backdrop);

function openPopup(handle, popup) {
  const ck = clickables.get(`popup${handle.dataset.popupOpen}`);
  if (ck) {
    menu.querySelectorAll("button.active").forEach((c) => {
      c.classList.remove("active");
    });
    ck.menuItems.forEach((c) => {
      c.classList.add("active");
    });
  }

  if (backdrop.classList.contains('open')) {
    if (handle.hasAttribute('data-popup-close')) {
      const openedPopup = handle.closest('[data-popup].open');

      if (openedPopup) {
        closePopup(openedPopup);
      }
    } else {
      return;
    }
  }
  popup.classList.add('open');
  backdrop.classList.add('open');
  menu.classList.add('temp-close');

  principalElem.classList.add(`p-${handle.dataset.popupOpen}`);

  // const closeBtn = popup.querySelector('.close');
  // if (closeBtn) {
  //   closeBtn.focus();
  // }

  if (handle && handle.dataset.zoom) {
    try {
      const coords = handle.dataset.zoom.split(',').map((coord) => parseFloat(coord));
      const [x, y, scale = 1.2] = coords;

      const imagem = document.querySelector('[data-zoom-imagem]');

      if (imagem) {
        imagem.classList.add('zoomed');
        imagem.style.transformOrigin = `${x}px ${y}px`;
        imagem.style.transform = `scale(${scale})`;

        if (handle.dataset.foco) {
          const [focoX, focoY] = handle.dataset.foco.split(',').map((coord) => parseFloat(coord));
          backdrop.style.setProperty('--x-zoom', `${focoX}px`);
          backdrop.style.setProperty('--y-zoom', `${focoY}px`);
        } else {
          backdrop.style.setProperty('--x-zoom', `${x}px`);
          backdrop.style.setProperty('--y-zoom', `${y}px`);
        }
      }
    } catch (e) {
      throwError('O atributo "data-zoom" deve ser um par de coordenadas separadas por vírgula');
    }
  } else {
    // se não tiver zoom, não deixar o foco aparecer
    backdrop.style.setProperty('--x-zoom', `-1000px`);
    backdrop.style.setProperty('--y-zoom', `-1000px`);
  }
}
function closePopup(popup) {
  popup.classList.remove('open');
  backdrop.classList.remove('open');
  menu.classList.remove('temp-close');

  principalElem.classList.forEach((className) => {
    if (className.startsWith('p-')) {
      principalElem.classList.remove(className);
    }
  });

  const imagem = document.querySelector('[data-zoom-imagem]');

  if (imagem && imagem.classList.contains('zoomed')) {
    imagem.classList.remove('zoomed');
    imagem.style.transform = '';
  }
}
document.body.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && backdrop.classList.contains('open')) {
    const openPopup = document.querySelector('[data-popup].open');
    closePopup(openPopup);
  }
})
document.querySelectorAll('[data-popup]').forEach((popup) => {
  const closeBtn = document.createElement('button');
  closeBtn.classList.add('close');
  closeBtn.innerText = '✖';
  closeBtn.title = 'Fechar';
  closeBtn.tabIndex = 0;
  popup.prepend(closeBtn);

  closeBtn.addEventListener('click', () => {
    closePopup(popup);
  });

  // joga os popups no final do principal
  principalElem.appendChild(popup);
});
document.querySelectorAll('[data-popup-open]').forEach((item) => {
  const popup = document.querySelector("#" + item.dataset.popupOpen);

  if (!popup) {
    throwError(`O popup ${item.dataset.popupOpen} não foi encontrado`);
  }

  item.addEventListener('click', () => {
    openPopup(item, popup);
  });
});
document.querySelectorAll('[data-popup-close]:not([data-popup-open])').forEach((closeModal) => {
  closeModal.addEventListener('click', () => {
    const popup = closeModal.closest('[data-popup]');
    closePopup(popup);
  });
});

// detecção dos tooltips
let activeTooltip = null;
let activeCleanup = null;
function showTooltip(handle, tooltip) {
  computePosition(handle, tooltip, {
    placement: "bottom",
    strategy: "fixed",
    middleware: [offset(5), flip(), shift()]
  }).then(({ x, y }) => {
    Object.assign(tooltip.style, {
      top: `${y}px`,
      left: `${x}px`,
    });
  });
}
document.body.addEventListener("click", (event) => {
  if (activeTooltip && !event.target.closest('[data-tooltip]') && !event.target.closest('[data-tooltip-open]')) {
    activeTooltip.style.display = 'none';
    activeTooltip = null;
    if (activeCleanup) {
      activeCleanup();
    }
  }
});
document.querySelectorAll("[data-tooltip-open]").forEach((handle) => {
  const tooltip = document.querySelector("#" + handle.dataset.tooltipOpen);
  let hoveringCleanup;

  handle.addEventListener("click", (event) => {
    if (activeTooltip) {
      activeTooltip.style.display = 'none';
      if (activeCleanup) {
        activeCleanup();
        activeCleanup = null;
      }
    }
    activeTooltip = tooltip;

    tooltip.style.display = 'block';
    activeCleanup = autoUpdate(handle, tooltip, () => showTooltip(handle, tooltip))
  });

  handle.addEventListener("mouseover", (event) => {
    if (activeTooltip !== tooltip && activeTooltip) {
      activeTooltip.style.display = 'none';
      activeTooltip = null;
      if (activeCleanup) {
        activeCleanup();
        activeCleanup = null;
      }
    }
    tooltip.style.display = 'block';
    hoveringCleanup = autoUpdate(handle, tooltip, () => showTooltip(handle, tooltip))
  });
  handle.addEventListener("mouseout", () => {
    if (activeTooltip === tooltip) {
      return;
    }
    tooltip.style.display = 'none';
    hoveringCleanup();
  });
});

// pra criar atalhos via hash
const hash = window.location.hash.slice(1);

if (hash) {
  if (hash === 'm') {
    menu.classList.toggle('open');
  } else {
    const clickIndex = parseInt(hash.replace('click', ''), 10);

    if (clickIndex) {
      const clickable = document.querySelectorAll("ul[data-menu] button")[clickIndex - 1];

      if (clickable) {
        clickable.click();

        setTimeout(() => {
          window.itemClicked = hash;
        }, 300);
      }
    }
  }
}