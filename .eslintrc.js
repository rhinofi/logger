// NOTE: wrapped version of eslint is provided via nix-shell
// (via eslint-with-config package) with default config file path provided via
// ESLINT_RHINO_BASE_CONFIG_PATH env var. Therefore eslint should not be added
// to this projects package.json. To have eslint available on PATH within your
// editor, start it from command line from within nix-shell or use an editor
// plugin which can load enviroment via nix/direnv for you Fox vscode, see
// following plugins:
// https://marketplace.visualstudio.com/items?itemName=mkhl.direnv
// https://marketplace.visualstudio.com/items?itemName=cab404.vscode-direnv

// Per project config can be specified here, but should be avoided in order to
// keep consistent style across projects.
module.exports = {
  // Stop eslint from traversing filesystem upwards, looking for more config
  // files.
  root: true,
  extends: [
    // Extending base config so we can override it's defaults here. If we
    // used --config cli flag, rules/options defined in base config would take
    // precendence over ones defined here.
    process.env.ESLINT_RHINO_BASE_CONFIG_PATH,
  ],
}
