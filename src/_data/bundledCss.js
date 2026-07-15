const fs = require("fs");
const path = require("path");

const CSS_DIR = path.join(__dirname, "..", "assets", "css");

module.exports = () =>
  fs
    .readdirSync(CSS_DIR)
    .filter((file) => file.endsWith(".css"))
    .sort()
    .map((file) => fs.readFileSync(path.join(CSS_DIR, file), "utf8"))
    .join("\n\n");
