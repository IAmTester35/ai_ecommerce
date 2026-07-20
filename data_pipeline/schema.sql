-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

DROP TABLE IF EXISTS cars;

-- Create the cars table
CREATE TABLE cars (
    id BIGINT PRIMARY KEY,
    price INT,
    year INT,
    manufacturer TEXT,
    model TEXT,
    condition TEXT,
    cylinders TEXT,
    fuel TEXT,
    odometer INT,
    title_status TEXT,
    transmission TEXT,
    drive TEXT,
    size TEXT,
    type TEXT,
    paint_color TEXT,
    description TEXT,
    embedding VECTOR(768)
);

-- Create an HNSW index for fast approximate nearest neighbor search
CREATE INDEX ON cars USING hnsw (embedding vector_cosine_ops);
