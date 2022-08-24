let
  pkgs = import ./nix/pkgs.nix {};
in
  pkgs.mkShell {
    packages = with pkgs; [
      dprint-with-config
      eslint-with-config
      nodejs
      yarn
    ];
  }
