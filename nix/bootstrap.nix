let
  pkgs = import <nixpkgs> {};
  inherit (pkgs) callPackage;
  # sources = import ./sources.nix;
  netrc-create = callPackage (import ./netrc-create.nix) {};
  bootstrap = callPackage;
in
  netrc-create

