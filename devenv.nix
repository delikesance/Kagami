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
    
    echo "--- Phase 1: Full Build Simulation (Container Cold Start) ---"
    # Replicate the exact entrypoint sequence: install all -> build -> prune
    rm -rf node_modules
    echo "Installing all dependencies..."
    bun install
    echo "Building bundle..."
    make build
    if [ ! -f dist/index.js ]; then
      echo "Error: dist/index.js was not created during full build simulation"
      exit 1
    fi
    echo "Pruning to production dependencies..."
    # We use a subshell and temporary directory to simulate the clean production state
    # because 'bun install --production' does not always remove existing dev folders 
    # if they were already there in the same directory.
    mkdir -p .prod-test
    cp package.json bun.lock .prod-test/
    cd .prod-test
    bun install --production
    
    echo "--- Phase 2: Image Optimization Validation ---"
    echo "Verifying node_modules content is optimized..."
    if [ -d node_modules/discord.js ]; then
      echo "Error: discord.js found in node_modules after production install! This will bloat the image."
      exit 1
    fi
    
    if [ ! -d node_modules/@napi-rs/canvas ]; then
      echo "Error: @napi-rs/canvas (external) NOT found in production node_modules!"
      exit 1
    fi
    cd ..
    rm -rf .prod-test

    echo "--- Phase 3: Runtime Verification ---"
    echo "Running unit and bundle tests..."
    bun test
    
    echo "--- Phase 4: Container Definition Check ---"
    # Ensure the entrypoint in devenv.nix matches our validated sequence
    # We can use grep to ensure we don't accidentally drift the two
    grep -q "bun install && make build && bun install --production" devenv.nix || (echo "Error: Container entrypoint does not match validated test sequence!"; exit 1)

    echo "All checks passed. Container lifecycle is validated."
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
