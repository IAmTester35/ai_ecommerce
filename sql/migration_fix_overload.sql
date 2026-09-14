-- ==============================================================================
-- AUTOMATCH AI - SUPABASE SCHEMA MIGRATION: FIX FUNCTION OVERLOADING & RPC
-- ==============================================================================

-- 1. DROP CẢ 2 PHIÊN BẢN OVERLOAD CŨ CỦA HÀM match_cars (8 tham số và 9 tham số)
-- Nguyên nhân: PostgreSQL không cho phép sửa/xóa DEFAULT parameter qua CREATE OR REPLACE (ERROR 42P13).
DROP FUNCTION IF EXISTS public.match_cars(vector, double precision, integer, text, bigint, integer, integer, text);
DROP FUNCTION IF EXISTS public.match_cars(vector, double precision, integer, text, bigint, integer, integer, text, uuid);

-- 2. TÁI TẠO HÀM match_cars CHUẨN DUY NHẤT (9 tham số hỗ trợ lọc Showroom)
CREATE OR REPLACE FUNCTION public.match_cars(
  query_embedding vector(768),
  match_threshold double precision DEFAULT 0.3,
  match_count integer DEFAULT 5,
  filter_make text DEFAULT NULL,
  filter_max_price bigint DEFAULT NULL,
  filter_target_year integer DEFAULT NULL,
  filter_min_hp integer DEFAULT NULL,
  filter_fuel_type text DEFAULT NULL,
  filter_showroom_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  make text,
  model text,
  year integer,
  engine_hp integer,
  price bigint,
  showroom_id uuid,
  metadata jsonb,
  review text,
  similarity double precision,
  image_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Phase 1: Vector search trên reviews bằng HNSW
  WITH vector_matches AS MATERIALIZED (
    SELECT
      r.id AS review_id,
      r.car_id,
      r.comment,
      1 - (r.embedding <=> query_embedding) AS sim
    FROM reviews r
    WHERE r.embedding IS NOT NULL
    ORDER BY r.embedding <=> query_embedding ASC
    LIMIT match_count * 20
  ),
  -- Phase 2: JOIN + filter metadata
  filtered AS (
    SELECT
      vm.review_id,
      vm.car_id,
      vm.comment,
      vm.sim,
      c.make AS car_make,
      c.model AS car_model,
      c.year AS car_year,
      c.engine_hp AS car_engine_hp,
      c.price AS car_price,
      c.showroom_id AS car_showroom_id,
      c.metadata AS car_metadata,
      c.image_url AS car_image_url
    FROM vector_matches vm
    JOIN cars c ON vm.car_id = c.id
    WHERE
      vm.sim > match_threshold
      AND (filter_make IS NULL OR c.make ILIKE filter_make)
      AND (filter_max_price IS NULL OR c.price <= filter_max_price)
      AND (filter_target_year IS NULL OR c.year >= filter_target_year - 2)
      AND (filter_min_hp IS NULL OR c.engine_hp >= filter_min_hp)
      AND (filter_fuel_type IS NULL OR c.metadata->>'engine_fuel_type' ILIKE '%' || filter_fuel_type || '%')
      AND (filter_showroom_id IS NULL OR c.showroom_id = filter_showroom_id)
  ),
  -- Phase 3: Deduplicate (1 review per car)
  deduplicated AS (
    SELECT
      *,
      ROW_NUMBER() OVER(PARTITION BY car_id ORDER BY sim DESC) AS rn
    FROM filtered
  )
  -- Phase 4: Output
  SELECT
    d.car_id AS id,
    d.car_make AS make,
    d.car_model AS model,
    d.car_year AS year,
    d.car_engine_hp AS engine_hp,
    d.car_price AS price,
    d.car_showroom_id AS showroom_id,
    d.car_metadata AS metadata,
    d.comment AS review,
    d.sim AS similarity,
    d.car_image_url AS image_url
  FROM deduplicated d
  WHERE d.rn = 1
  ORDER BY d.sim DESC
  LIMIT match_count;
END;
$$;

-- 3. CẤP QUYỀN THỰC THI CHO ANON VÀ AUTHENTICATED
GRANT EXECUTE ON FUNCTION public.match_cars(vector, double precision, integer, text, bigint, integer, integer, text, uuid) TO anon, authenticated, service_role;
