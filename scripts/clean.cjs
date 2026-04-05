const fs = require("fs");
const path = require("path");

function getProjectRoot() {
  let packageJson = process.env.npm_package_json;

  if (!packageJson) {
    throw new Error("npm_package_json is not set. Run this via an npm script.");
  }

  if (
    packageJson.charCodeAt(0) === 92 &&
    packageJson.charCodeAt(1) === 92 &&
    packageJson.charCodeAt(2) === 63 &&
    packageJson.charCodeAt(3) === 92
  ) {
    packageJson = packageJson.slice(4);
  }

  return path.dirname(packageJson);
}

function remove(directories) {
  const root = getProjectRoot();

  for (const directory of directories) {
    fs.rmSync(path.join(root, directory), {
      recursive: true,
      force: true,
    });
  }
}

module.exports = {
  remove,
};
