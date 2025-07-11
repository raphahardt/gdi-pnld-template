const {computePosition, offset, flip, shift, autoUpdate} = window.FloatingUIDOM;

function throwError(message) { alert(message); throw new Error(message); }

// checagens
if (!document.querySelector('.principal')) {
  throwError('O elemento com a classe "principal" é obrigatório');
}

const isVertical = document.body.classList.contains("vertical");
const proportion = { ho: isVertical ? 720 : 1280, ve: isVertical ? 1280 : 720 };
const principalElem = document.querySelector(".principal");

let mainScale = 1;
const resizeObserver = new ResizeObserver((entries) => {
  const rect = entries[0].target.getBoundingClientRect();
  const mainRect = { width: proportion.ho, height: proportion.ve };

  mainScale = Math.min(rect.width / mainRect.width, rect.height / mainRect.height);
  const xDiff = mainRect.width - rect.width;
  const translateX = xDiff > 0 && mainScale !== 0 ? -xDiff / 2 / mainScale : 0;
  const yDiff = mainRect.height - rect.height;
  const translateY = yDiff > 0 && mainScale !== 0 ? -yDiff / 2 / mainScale : 0;

  Object.assign(principalElem.style, {
    width: `${mainRect.width}px`,
    height: `${mainRect.height}px`,
    transform: `scale(${mainScale}) translate(${translateX}px, ${translateY}px)`,
  });
});

resizeObserver.observe(document.body);

function getPrincipalRect() {
  return principalElem.getBoundingClientRect();
}

// zoom principal
const zoomContainers = [
  document.querySelector("[data-zoom-principal]"),
  ...document.querySelectorAll("[data-zoom-interno] > [data-zoom-interno-conteudo]")
];

zoomContainers.forEach((zoomContainer) => {
  if (zoomContainer) {
    let dragging = false;
    let offsetX = 0, offsetY = 0;
    let startX = parseFloat(zoomContainer.style.getPropertyValue("--zoom-offset-x") || 0);
    let startY = parseFloat(zoomContainer.style.getPropertyValue("--zoom-offset-y") || 0);

    function zoomMoveStart(ev) {
      ev.preventDefault();
      const rect = getPrincipalRect();

      const elem = ev.type === "touchstart" ? ev.touches[0] : ev;

      offsetX = (elem.clientX - rect.x) / mainScale;
      offsetY = (elem.clientY - rect.y) / mainScale;

      startX = parseFloat(zoomContainer.style.getPropertyValue("--zoom-offset-x") || 0);
      startY = parseFloat(zoomContainer.style.getPropertyValue("--zoom-offset-y") || 0);

      dragging = true;
    }

    function zoomMove(ev) {
      if (dragging) {
        const rect = getPrincipalRect();
        const scale = parseFloat(zoomContainer.style.getPropertyValue("--zoom-mult") || 1);
        const limitX = (((proportion.ho * scale) - proportion.ho) / 2) / scale;
        const limitY = (((proportion.ve * scale) - proportion.ve) / 2) / scale;

        const elem = ev.type === "touchmove" ? ev.touches[0] : ev;

        const cliX = (elem.clientX - rect.x) / mainScale;
        const cliY = (elem.clientY - rect.y) / mainScale;

        const deltaX = cliX - offsetX;
        const deltaY = cliY - offsetY;

        const newX = Math.min(Math.max(startX + deltaX, -limitX), limitX);
        const newY = Math.min(Math.max(startY + deltaY, -limitY), limitY);

        zoomContainer.style.setProperty("--zoom-offset-x", `${newX}px`);
        zoomContainer.style.setProperty("--zoom-offset-y", `${newY}px`);
      }
    }

    function zoomMoveEnd(ev) {
      ev.preventDefault();
      dragging = false;
    }

    zoomContainer.addEventListener("mousedown", zoomMoveStart);
    zoomContainer.addEventListener("mousemove", zoomMove);
    zoomContainer.addEventListener("mouseup", zoomMoveEnd);
    zoomContainer.addEventListener("touchstart", zoomMoveStart);
    zoomContainer.addEventListener("touchmove", zoomMove);
    zoomContainer.addEventListener("touchend", zoomMoveEnd);
  }
})
if (zoomContainers.length) {
  const zoomAdder = 0.5;
  const firstZoomContainer = zoomContainers[0];

  const zoomButtons = [document.createElement("button"), document.createElement("button")]
  .map((btn, i) => {
    const isOut = i === 0;
    btn.classList.add("zoom-btn");
    btn.classList.add(`zoom-${isOut ? "out" : "in"}`);
    btn.addEventListener("click", (event) => {
      const adder = isOut ? -zoomAdder : zoomAdder;
      const scale = parseFloat(firstZoomContainer.style.getPropertyValue("--zoom-mult") || 1) + adder;
      const normalizedScale = Math.max(1, Math.min(10, scale));

      // atualiza o offset pra não quebrar o conteúdo
      const actX = parseFloat(firstZoomContainer.style.getPropertyValue("--zoom-offset-x") || 0);
      const actY = parseFloat(firstZoomContainer.style.getPropertyValue("--zoom-offset-y") || 0);
      const limitX = (((proportion.ho * normalizedScale) - proportion.ho) / 2) / normalizedScale;
      const limitY = (((proportion.ve * normalizedScale) - proportion.ve) / 2) / normalizedScale;
      const newX = Math.min(Math.max(actX, -limitX), limitX);
      const newY = Math.min(Math.max(actY, -limitY), limitY);

      zoomContainers.forEach((zoomContainer) => {
        zoomContainer.style.setProperty("--zoom-mult", normalizedScale);
        zoomContainer.style.setProperty("--zoom-offset-x", `${newX}px`);
        zoomContainer.style.setProperty("--zoom-offset-y", `${newY}px`);
      });
    })

    return btn;
  });

  const zoomButtonsContainer = document.createElement("div");
  zoomButtonsContainer.classList.add("zoom-buttons");
  zoomButtonsContainer.append(...zoomButtons);

  principalElem.appendChild(zoomButtonsContainer);
}

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

document.querySelectorAll("[data-click],[data-click-hidden]").forEach((item, itemIndex) => {
  // faz com que o item seja focável
  //item.tabIndex = 0;
  let action = { action: "none", id: "" };
  if (item.dataset.popupOpen) {
    action = { action: "popup", id: item.dataset.popupOpen };
  }
  if (item.dataset.tooltipOpen) {
    action = { action: "tooltip", id: item.dataset.tooltipOpen };
  }
  if (item.dataset.collapseToggle) {
    action = { action: "collapse", id: item.dataset.collapseToggle };
  }
  if (!clickables.has(`${action.action}${action.id}`)) {
    clickables.set(`${action.action}${action.id}`, {menuItems: [], action});
  }

  document.querySelectorAll("ul[data-menu]").forEach((menu) => {
    const menuItemLi = document.createElement("li");
    const menuItem = document.createElement("button");
    menuItem.classList.add("menu-item");
    menuItem.classList.add(`m-${action.action}${action.id}`);
    if (item.hasAttribute("data-click-hidden")) {
      menuItemLi.style.overflow = "hidden";
      menuItemLi.style.height = "0";
      menuItemLi.style.padding = "0";
      menuItemLi.style.border = "none";
      menuItemLi.setAttribute("aria-hidden", "true");
      menuItem.innerText = `Clicável ${itemIndex + 1} (oculto)`;
    } else if (item.dataset.click) {
      if (item.dataset.click.match(/<span.*<\/span>/)) {
        menuItem.innerHTML = item.dataset.click.replace(/<(?!\/?span).*?>/g, ""); // retira todas as tags q não sejam span
      } else {
        menuItem.innerText = item.dataset.click;
      }
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

    // não mostrar itens de collapse no menu
    if (action.action === "collapse") {
      menuItemLi.style.display = "none";
    }

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
  const menuSlides = document.querySelector("ul[data-menu]");
  const firstSlide = slides.querySelector("[data-slide]");
  const lastSlide = slides.querySelector("[data-slide]:last-child");
  const rightElem = document.createElement("button");
  const leftElem = document.createElement("button");
  rightElem.classList.add("slide-right");
  leftElem.classList.add("slide-left");
  rightElem.innerText = "❯";
  leftElem.innerText = "❮";

  principalElem.appendChild(rightElem);
  principalElem.appendChild(leftElem);

  const allSlides = slides.querySelectorAll("[data-slide]");

  allSlides.forEach((slid, index) => {
    const menuItemLi = document.createElement("li");
    const menuItem = document.createElement("button");
    menuItem.classList.add("menu-item");
    menuItem.innerText = `Foto ${index + 1}`;
    menuItem.addEventListener("click", (event) => {
      slides.querySelector(".ativo").classList.remove("ativo");
      slid.classList.add("ativo");

      // pinta o menu
      menuSlides.querySelectorAll("button.active").forEach((c) => {
        c.classList.remove("active");
      });
      menuItem.classList.add("active");
    });

    menuItemLi.append(menuItem);
    menuSlides.append(menuItemLi);
  });

  if (firstSlide) {
    firstSlide.classList.add("ativo");
    menuSlides.querySelector("button")?.classList.add("active");
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
    // menu.classList.remove("open");

    menuSlides.querySelectorAll("button").forEach((c, index) => {
      c.classList.remove("active");
      if (index === Array.from(allSlides).indexOf(slides.querySelector(".ativo"))) {
        c.classList.add("active");
      }
    });
  });

  leftElem.addEventListener("click", (event) => {
    const prevSlide = slides.querySelector(".ativo") === firstSlide ? lastSlide : allSlides[Array.from(allSlides).indexOf(slides.querySelector(".ativo")) - 1];

    if (prevSlide) {
      slides.querySelector(".ativo").classList.remove("ativo");
      prevSlide.classList.add("ativo");
    } else {
      slides.querySelector(".ativo").classList.remove("ativo");
      lastSlide.classList.add("ativo");
    }

    // força fechar o menu
    // menu.classList.remove("open");
    menuSlides.querySelectorAll("button").forEach((c, index) => {
      c.classList.remove("active");
      if (index === Array.from(slides.querySelectorAll("[data-slide]")).indexOf(slides.querySelector(".ativo"))) {
        c.classList.add("active");
      }
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
function showCollapse(content) {
  const ck = clickables.get(`collapse${content.id}`);
  if (ck && !menu.querySelector("button.active")) {
    menu.querySelectorAll("button.active").forEach((c) => {
      c.classList.remove("active");
    });
    ck.menuItems.forEach((c) => {
      c.classList.add("active");
    });
  }

  content.classList.add("open");
  content.removeAttribute('hidden');
}
function hideCollapse(content) {
  const ck = clickables.get(`collapse${content.id}`);
  if (ck && ck.menuItems.includes(menu.querySelector("button.active"))) {
    ck.menuItems.forEach((c) => {
      c.classList.remove("active");
    });
  }

  content.classList.remove("open");
  content.setAttribute('hidden', 'true');
}
document.querySelectorAll('[data-collapse-toggle]').forEach((handle) => {
  if (handle.dataset.collapseOpen || handle.dataset.collapseClose) {
    throwError('O atributo "data-collapse-toggle" não pode ser usado em conjunto com "data-collapse-open" ou "data-collapse-close"');
  }

  const content = document.querySelector("#" + handle.dataset.collapseToggle);
  handle.setAttribute('aria-expanded', 'false');
  handle.setAttribute('aria-controls', content.id);
  content.setAttribute('hidden', 'true');

  handle.addEventListener('click', () => {
    const isOpen = content.getAttribute('hidden') !== 'true';

    if (isOpen) {
      handle.setAttribute('aria-expanded', 'false');
      hideCollapse(content);
    } else {
      const group = handle.closest('[data-collapse-grupo]');
      if (group) {
        group.querySelectorAll('[data-collapse]').forEach((other) => {
          const handleOther = document.querySelector(`[data-collapse-open="${other.id}"],[data-collapse-toggle="${other.id}"]`);
          handleOther.setAttribute('aria-expanded', 'false');
          hideCollapse(other);
        });
      }
      handle.setAttribute('aria-expanded', 'true');
      showCollapse(content);
    }
  });
});
document.querySelectorAll('[data-collapse-open]').forEach((handle) => {
  if (handle.dataset.collapseClose) {
    throwError('O atributo "data-collapse-open" não pode ser usado em conjunto com "data-collapse-close"');
  }
  const content = document.querySelector("#" + handle.dataset.collapseOpen);
  handle.setAttribute('aria-expanded', 'false');
  handle.setAttribute('aria-controls', content.id);
  content.setAttribute('hidden', 'true');

  handle.addEventListener('click', () => {
    const isOpen = content.getAttribute('hidden') !== 'true';

    if (!isOpen) {
      const group = handle.closest('[data-collapse-grupo]');
      if (group) {
        group.querySelectorAll('[data-collapse]').forEach((other) => {
          const handleOther = document.querySelector(`[data-collapse-open="${other.id}"],[data-collapse-toggle="${other.id}"]`);
          handleOther.setAttribute('aria-expanded', 'false');
          hideCollapse(other);
        });
      }
      handle.setAttribute('aria-expanded', 'true');
      showCollapse(content);
    }
  });
});
document.querySelectorAll('[data-collapse-close]').forEach((handle) => {
  const content = (handle.dataset.collapseClose && document.querySelector("#" + handle.dataset.collapseClose)) || handle.closest('[data-collapse]');

  handle.addEventListener('click', () => {
    const isOpen = content.getAttribute('hidden') !== 'true';
    // console.log(isOpen, content)

    if (isOpen) {
      hideCollapse(content);
    }
  });
});

// detecção dos popups
const backdrop = document.createElement('div');
backdrop.classList.add('backdrop');
document.querySelector('.principal').prepend(backdrop);

function getPopupParent(popup) {
  const parent = popup.parentElement.closest('[data-popup]');

  if (!parent) {
    return "";
  }

  return parent.id;
}

function openPopup(handle, popup) {
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
  const ck = clickables.get(`popup${handle.dataset.popupOpen}`);
  if (ck) {
    console.log("ck", ck);
    menu.querySelectorAll("button.active").forEach((c) => {
      c.classList.remove("active");
    });
    ck.menuItems.forEach((c) => {
      c.classList.add("active");
    });
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

  menu.querySelectorAll("button.active").forEach((c) => {
    c.classList.remove("active");
  });

  const parentPopup = popup.dataset.parentPopup && document.querySelector(`#${popup.dataset.parentPopup}`);
  if (parentPopup) {
    openPopup(principalElem.querySelector(`[data-popup-open="${popup.dataset.parentPopup}"]`), parentPopup);
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

  popup.setAttribute("data-parent-popup", getPopupParent(popup));

  closeBtn.addEventListener('click', () => {
    closePopup(popup);
  });

  const slideRightButton = popup.querySelector('.popup-slide-right');
  const slideLeftButton = popup.querySelector('.popup-slide-left');
  const popupSlides = popup.querySelectorAll('.data-popup-slide');

  if (slideRightButton && slideLeftButton && popupSlides.length > 0) {
    slideRightButton.addEventListener('click', () => {
      const currentActiveSlide = popup.querySelector('.data-popup-slide.ativo');
      let nextSlide = currentActiveSlide.nextElementSibling;

      // Se não houver próximo irmão ou não for um slide, volta para o primeiro slide
      if (!nextSlide || !nextSlide.classList.contains('data-popup-slide')) {
        nextSlide = popupSlides[0];
      }

      currentActiveSlide.classList.remove('ativo');
      nextSlide.classList.add('ativo');
    });

    slideLeftButton.addEventListener('click', () => {
      const currentActiveSlide = popup.querySelector('.data-popup-slide.ativo');
      let prevSlide = currentActiveSlide.previousElementSibling;

      // Se não houver irmão anterior ou não for um slide, volta para o último slide
      if (!prevSlide || !prevSlide.classList.contains('data-popup-slide')) {
        prevSlide = popupSlides[popupSlides.length - 1];
      }

      currentActiveSlide.classList.remove('ativo');
      prevSlide.classList.add('ativo');
    });
  }

  const slideImageRightButton = popup.querySelector('.popup-imagem-slide-right');
  const slideImageLeftButton = popup.querySelector('.popup-imagem-slide-left');
  const popupImageSlides = popup.querySelectorAll('.data-popup-imagem-slide');

  if (slideImageRightButton && slideImageLeftButton && popupImageSlides.length > 0) {
    slideImageRightButton.addEventListener('click', () => {
      const currentActiveSlideImage = popup.querySelector('.data-popup-imagem-slide.popup-imagem-ativo');
      let nextSlideImage = currentActiveSlideImage.nextElementSibling;

      // Se não houver próximo irmão ou não for um slide, volta para o primeiro slide
      if (!nextSlideImage || !nextSlideImage.classList.contains('data-popup-imagem-slide')) {
        nextSlideImage = popupImageSlides[0];
      }

      currentActiveSlideImage.classList.remove('popup-imagem-ativo');
      nextSlideImage.classList.add('popup-imagem-ativo');
    });

    slideImageLeftButton.addEventListener('click', () => {
      const currentActiveSlideImage = popup.querySelector('.data-popup-imagem-slide.popup-imagem-ativo');
      let prevSlideImage = currentActiveSlideImage.previousElementSibling;

      // Se não houver irmão anterior ou não for um slide, volta para o último slide
      if (!prevSlideImage || !prevSlideImage.classList.contains('data-popup-imagem-slide')) {
        prevSlideImage = popupImageSlides[popupImageSlides.length - 1];
      }

      currentActiveSlideImage.classList.remove('popup-imagem-ativo');
      prevSlideImage.classList.add('popup-imagem-ativo');
    });
  }

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
[...document.querySelectorAll('[data-popup-close-all]'), backdrop].forEach((closeModal) => {
  closeModal.addEventListener('click', () => {
    const popups = document.querySelectorAll('[data-popup]');
    popups.forEach((popup) => {
      closePopup(popup);
    });
  });
});

// detecção dos tooltips
let activeTooltip = null;
let activeCleanup = null;
function showTooltip(handle, tooltip) {
  // type Placement =
  //   | 'top'
  //   | 'top-start'
  //   | 'top-end'
  //   | 'right'
  //   | 'right-start'
  //   | 'right-end'
  //   | 'bottom'
  //   | 'bottom-start'
  //   | 'bottom-end'
  //   | 'left'
  //   | 'left-start'
  //   | 'left-end';
  const placement = tooltip.dataset.tooltipPosition || "bottom";

  // check if placement is valid
  const validPlacements = ['top', 'top-start', 'top-end', 'right', 'right-start', 'right-end', 'bottom', 'bottom-start', 'bottom-end', 'left', 'left-start', 'left-end'];
  if (!validPlacements.includes(placement)) {
    throwError('O valor do atributo "data-tooltip-position" deve ser "top", "top-start", "top-end", "right", "right-start", "right-end", "bottom", "bottom-start", "bottom-end", "left", "left-start" ou "left-end"');
  }

  computePosition(handle, tooltip, {
    placement,
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
      } else {
        // é slide?
        const slide = document.querySelectorAll("[data-slide]")[clickIndex - 1];

        if (slide) {
          document.querySelector("[data-slide].ativo").classList.remove("ativo");
          slide.classList.add("ativo");
        }
      }
    }
  }
}