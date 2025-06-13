set dotenv-load

export EDITOR := 'nvim'

default:
  just --list

dev:
  bun run dev
