{
  sources ? import ./sources.nix,
  config ? {},
  system ? builtins.currentSystem,
  overlays ? []
}:
let
  allOverlays =
    # These overlays augment centrally defined packages with things specific
    # to this service.
    [
      (self: super: {
        ci = {
          pr-step = self.callPackage
            ({
              lib,
              utils,
              yarn-berry,
              nodejs,
              name ? "pr-step"
            }:
            let
              yarnExe = lib.getExe yarn-berry;
            in utils.writeBashBin
              name
              ''
              set -ueo pipefail

              echo yarn version: $(${yarnExe} --version)

              ${yarnExe} --immutable
              # TODO: add tests
              # ${yarnExe} test
              ''
            )
            {}
          ;
          deploy-step = self.npm-publish;
        };
      })
      (self: super: super.reusable-overlays.ci-add-linting-and-formatting-checks self super)
    ]
    ++
    overlays
  ;

  # This can be used to work against local version of copy of launch-deversifi
  # repo instead of specific git commit defined in sources.json
  # pkgsBasePath = ../../launch-deversifi;
  pkgsBasePath = sources.launch-deversifi;
  pkgsPath = pkgsBasePath + "/nix/pkgs.nix";
in
  import pkgsPath { inherit config system; overlays = allOverlays; }
