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
    


    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}
