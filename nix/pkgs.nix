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
