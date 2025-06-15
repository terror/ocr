set dotenv-load

export EDITOR := 'nvim'

alias d := dev
alias f := fmt
alias t := test

default:
  just --list

fmt:
  prettier --write .

dev:
  bun run dev

test:
  bun test
