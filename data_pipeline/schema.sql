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
    embedding VECTOR(3072) -- Gemini embedding 2 dimension is 3072
);

-- Create an HNSW index for fast approximate nearest neighbor search
-- Note: pgvector restricts standard vector indexing to 2000 dimensions. 
-- For 3072 dimensions, we must cast to halfvec.
CREATE INDEX ON cars USING hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);
