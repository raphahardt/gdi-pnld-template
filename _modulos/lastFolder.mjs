import fs from "node:fs";
import path from "path";

export function getLastFolder() {
  let lastStartFolder = fs.existsSync(".last_cwd")
    ? fs.readFileSync(".last_cwd", "utf8")
    : process.cwd();
  if (!fs.statSync(lastStartFolder).isDirectory()) {
    lastStartFolder = process.cwd();
  }

  return lastStartFolder;
}

export function setLastFolder(folder) {
  fs.writeFileSync(".last_cwd", folder);
}

export function* iterateFolders(folder) {
  if (fs.existsSync(path.join(folder, "atualizar_resources.mjs"))) {
    return;
  }

  if (fs.existsSync(path.join(folder, "resources")) && fs.existsSync(path.join(folder, "index.html"))) {
    const html = fs.readFileSync(path.join(folder, "index.html"), { encoding: "utf8" });

    if (html.includes("/floating-ui.js")) {
      yield folder;
      return;
    }
  }

  const folders = fs.readdirSync(folder);

  for (const f of folders) {
    const fullPath = path.join(folder, f);

    if (fs.statSync(fullPath).isDirectory()) {
      if (fs.existsSync(path.join(fullPath, "atualizar_resources.mjs"))) {
        continue;
      }

      yield* iterateFolders(fullPath);
    }
  }
}