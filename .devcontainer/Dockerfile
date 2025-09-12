# Base con Node 20
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:20

# Instala dependencias para Docker
RUN apt-get update && \
    apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    sudo \
    git \
    docker.io docker-compose

# Permite que el usuario vscode use Docker sin sudo
RUN groupadd -g 999 docker || true
RUN usermod -aG docker vscode

# Verificar versiones
RUN docker --version
RUN docker-compose --version

# Establecer directorio de trabajo
WORKDIR /workspace
