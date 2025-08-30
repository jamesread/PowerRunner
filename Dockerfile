FROM docker.io/lipanski/docker-static-website:latest

LABEL org.opencontainers.image.source="https://github.com/jamesread/PowerRunner"

COPY dist/ .
