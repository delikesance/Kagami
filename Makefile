# Ensure BWS_ACCESS_TOKEN is provided
ifndef BWS_ACCESS_TOKEN
$(error BWS_ACCESS_TOKEN is not set. Please provide it, e.g., 'export BWS_ACCESS_TOKEN=your_token')
endif

# Get Project ID dynamically
PROJECT_ID := $(shell bws project list | jq -r '.[] | select(.name == "kagami") | .id')

.PHONY: dev start build

dev:
	bws run --project-id $(PROJECT_ID) -- bun run --watch src/index.ts

build:
	bun run build

start:
	bws run --project-id $(PROJECT_ID) -- bun run dist/index.js
