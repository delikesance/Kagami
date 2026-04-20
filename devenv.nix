{ pkgs, lib, config, inputs, ... }:

{
  packages = [ 
    pkgs.bun
    pkgs.bws
    pkgs.jq
    pkgs.gnumake
  ];

  scripts.hello.exec = "echo welcome to Kagami development environment!";
  scripts.start.exec = "make start";

  enterShell = ''
    hello
    bun install
  '';

  dotenv.enable = true;

  processes.bot.exec = "make dev";
  processes.start.exec = "make build && make start";

  enterTest = ''
    # Mock BWS token for Makefile check
    export BWS_ACCESS_TOKEN=test
    
    echo "Testing installation..."
    bun install
    
    echo "Testing bundling..."
    make build
    if [ ! -f dist/index.js ]; then
      echo "Error: dist/index.js was not created"
      exit 1
    fi
    
    echo "Running unit and bundle tests..."
    bun test
    
    echo "Testing production installation (image size optimization)..."
    # Create a temporary directory for production install to truly verify size reduction
    mkdir -p .prod-test
    cp package.json bun.lock .prod-test/
    cd .prod-test
    bun install --production
    
    echo "Verifying node_modules content..."
    if [ -d node_modules/discord.js ]; then
      echo "Error: discord.js found in production node_modules! Bundling is not working as expected for size reduction."
      exit 1
    fi
    
    if [ ! -d node_modules/@napi-rs/canvas ]; then
      echo "Error: @napi-rs/canvas (external) NOT found in production node_modules!"
      exit 1
    fi
    
    echo "Production environment check passed (Native deps kept, bundled deps removed)."
    cd ..
    rm -rf .prod-test
  '';

  containers."kagami" = {
    name = "kagami";
    entrypoint = [ "bash" "-c" "export PATH=${config.devenv.profile}/bin:$PATH && export SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt && cd /env/*-source && bun install && make build && bun install --production && exec make start" ];
    copyToRoot = [
      pkgs.cacert
      (lib.cleanSource ./.)
    ];
  };
}
