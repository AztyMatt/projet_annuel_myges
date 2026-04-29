#!/bin/bash

# Prevents Git Bash on Windows from converting Unix paths to Windows absolute paths
export MSYS_NO_PATHCONV=1

# Reset du fichier .env
> .env

### General
printf "\n### General\n" >> .env
infisical export --env=dev --path=/ >> .env

### Frontend
printf "\n### Frontend\n" >> .env
infisical export --env=dev --path=/frontend >> .env

### Backend
printf "\n### Backend\n" >> .env
infisical export --env=dev --path=/backend >> .env

### Postgres
printf "\n### Postgres\n" >> .env
infisical export --env=dev --path=/postgres >> .env
