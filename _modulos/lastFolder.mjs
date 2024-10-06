import fs from "node:fs";

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