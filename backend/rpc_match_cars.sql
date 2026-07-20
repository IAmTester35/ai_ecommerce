CREATE OR REPLACE FUNCTION match_cars(
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT,
  filter_manufacturer TEXT DEFAULT NULL,
  filter_max_price INT DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  manufacturer TEXT,
  model TEXT,
  year INT,
  price INT,
  description TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cars.id,
    cars.manufacturer,
    cars.model,
    cars.year,
    cars.price,
    cars.description,
    1 - (cars.embedding <=> query_embedding) AS similarity
  FROM cars
  WHERE 
    (filter_manufacturer IS NULL OR cars.manufacturer ILIKE filter_manufacturer)
    AND (filter_max_price IS NULL OR cars.price <= filter_max_price)
    AND 1 - (cars.embedding <=> query_embedding) > match_threshold
  ORDER BY cars.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
