const path = require("path");
const { spawn } = require("child_process");

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

function run(command) {
  const root = getProjectRoot();
  const nextBin = require.resolve("next/dist/bin/next", { paths: [root] });
  const child = spawn(process.execPath, [nextBin, command], {
    cwd: root,
    stdio: "inherit",
    windowsHide: false,
  });

  child.on("error", (error) => {
    console.error(error);
    process.exit(1);
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

module.exports = {
  run,
};
