{ pkgs, lib, config, inputs, ... }:

{
  # https://devenv.sh/packages/
  packages = [ 
    pkgs.bun
    pkgs.bws
    pkgs.jq
    pkgs.gnumake
  ];

  # https://devenv.sh/scripts/
  scripts.hello.exec = "echo welcome to Kagami development environment!";
  scripts.start.exec = "make start";

  enterShell = ''
    hello
    bun install
  '';

  dotenv.enable = true;

  # https://devenv.sh/processes/
  processes.bot.exec = "make dev";
  processes.start.exec = "make start";

  # https://devenv.sh/containers/
  containers."kagami" = {
    name = "kagami";
    entrypoint = [ "bash" "-c" "export PATH=${config.devenv.profile}/bin:$PATH && export SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt && cd /env/*-source && exec start" ];
    copyToRoot = [
      pkgs.cacert
      (lib.cleanSource ./.)
    ];
  };
}
