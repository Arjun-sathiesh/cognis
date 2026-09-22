FROM python:3.11-slim

WORKDIR /app

# Copy dependency file first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

EXPOSE 8000

CMD ["python", "main.py"]
