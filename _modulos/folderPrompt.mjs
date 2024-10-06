import path from "node:path";
import fs from "node:fs";

import {
  createPrompt,
  isBackspaceKey,
  isDownKey,
  isEnterKey,
  isUpKey,
  useKeypress,
  usePagination,
  useState,
} from "@inquirer/core";

export default createPrompt((config, done) => {
  const [active, setActive] = useState(0);
  const [currentFolder, setCurrentFolder] = useState(
    config.startFolder ?? process.cwd(),
  );

  const allChoices = fs
  .readdirSync(currentFolder)
  .filter((file) => fs.statSync(path.join(currentFolder, file)).isDirectory())
  .map((file) => ({
    option: "folder",
    name: path.basename(file),
    value: path.join(currentFolder, file),
  }));

  allChoices.unshift({
    option: "back",
    name: ".. (voltar uma pasta)",
    value: path.dirname(currentFolder),
  });
  allChoices.unshift({
    option: "current",
    name: ". (selecione essa pasta)",
    value: currentFolder,
  });

  useKeypress((key) => {
    if (isUpKey(key)) {
      setActive((active - 1 + allChoices.length) % allChoices.length);
    } else if (isDownKey(key)) {
      setActive((active + 1) % allChoices.length);
    } else if (isEnterKey(key)) {
      if (allChoices[active].option === "current") {
        done(allChoices[active].value);
      } else {
        setActive(0);
        setCurrentFolder(allChoices[active].value);
      }
    } else if (isBackspaceKey(key)) {
      done("");
    }
  });

  const page = usePagination({
    items: allChoices.map((choice) => choice.name),
    active: active,
    renderItem: ({ item, index, isActive }) =>
      `${isActive ? "[>]" : "[ ]"} ${item.toString()}`,
    pageSize: 7,
    loop: false,
  });

  return `$ ${currentFolder}\n${config.message}\n\n${page}`;
});
