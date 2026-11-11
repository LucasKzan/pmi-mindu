FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Instalar dependências de sistema para bibliotecas geoespaciais (GDAL, GEOS, PROJ)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgdal-dev \
    gdal-bin \
    libgeos-dev \
    libproj-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependências Python
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copiar os arquivos necessários do projeto
COPY backend /app/backend
COPY data/processed /app/data/processed
COPY frontend/sigweb-dashboard/public /app/frontend/sigweb-dashboard/public

# Criar pasta de uploads se não existir
RUN mkdir -p /app/backend/uploads

EXPOSE 8000

ENV PORT=8000

CMD ["sh", "-c", "cd /app/backend/api && uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
