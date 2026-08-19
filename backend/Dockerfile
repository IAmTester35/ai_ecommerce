# ==========================================
# STAGE 1: Build dependencies
# ==========================================
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


# ==========================================
# STAGE 2: Minimal Runtime 
# ==========================================
FROM python:3.11-slim AS runner

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Cài curl để hỗ trợ docker healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /opt/venv /opt/venv
COPY . .

EXPOSE 8000

# Chạy 1 worker (tiêu thụ ~70-90MB RAM)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
