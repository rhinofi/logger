let
  pkgs = import ./nix/pkgs.nix {};
  npm-publish = pkgs.utils.writeBashBin "npm-publish" ''
    set -ueo pipefail

    # Using yarn provided by nix shell.
    GITHUB_PACKAGE_REGISTRY_ACCESS_TOKEN=$(${pkgs.lib.getExe pkgs.github-token-from-netrc}) \
      yarn npm publish "''${@}"
  '';
in
  pkgs.mkShell {
    inputsFrom = [pkgs.dev-shell-with-node-yarn-berry];
    packages = with pkgs; [
      npm-publish
      dprint-with-config
      eslint-with-config
    ];
  }
