export interface CarResponse {
  id: number;
  car_name: string;
  price: number;
  engine_type: string;
  manufacturer: string;
  year: number;
  description?: string;
  image_url?: string;
}

export interface SearchResponse {
  original_query: string;
  constraints: Record<string, any>;
  results: CarResponse[];
  conflict_detected: boolean;
  ai_message: string;
}

const MOCK_CAR_IMAGES = [
  "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=2115&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2069&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=2070&auto=format&fit=crop"
];

export async function searchCars(query: string): Promise<SearchResponse> {
  try {
    const res = await fetch("http://127.0.0.1:8000/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }

    const data: SearchResponse = await res.json();
    
    // Add mock images if missing
    data.results = data.results.map((car, index) => ({
      ...car,
      image_url: car.image_url || MOCK_CAR_IMAGES[index % MOCK_CAR_IMAGES.length]
    }));

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}
