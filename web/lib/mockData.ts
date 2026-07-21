export interface Car {
  id: string;
  name: string;
  brand: string;
  price: number;
  engine: string;
  seats: number;
  fuelType: 'Xăng' | 'Dầu' | 'Điện' | 'Hybrid';
  year: number;
  imageUrl: string;
  description: string;
  isFeatured?: boolean;
  isNew?: boolean;
}

export const MOCK_CARS: Car[] = [
  {
    id: "c1",
    name: "VinFast VF 8",
    brand: "VinFast",
    price: 1090000000,
    engine: "Động cơ điện đôi",
    seats: 5,
    fuelType: "Điện",
    year: 2024,
    imageUrl: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=2115&auto=format&fit=crop",
    description: "VinFast VF 8 là mẫu SUV thuần điện thông minh, mang đến trải nghiệm lái mạnh mẽ, công nghệ an toàn tiên tiến và không gian nội thất vô cùng rộng rãi.",
    isFeatured: true,
    isNew: true
  },
  {
    id: "c2",
    name: "Honda CR-V",
    brand: "Honda",
    price: 1159000000,
    engine: "1.5L VTEC TURBO",
    seats: 7,
    fuelType: "Xăng",
    year: 2023,
    imageUrl: "https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?q=80&w=2069&auto=format&fit=crop",
    description: "Honda CR-V sở hữu thiết kế thể thao, không gian linh hoạt 7 chỗ ngồi cùng động cơ VTEC Turbo mạnh mẽ, tối ưu nhiên liệu.",
    isFeatured: true
  },
  {
    id: "c3",
    name: "Mercedes-Benz GLC 300",
    brand: "Mercedes",
    price: 2799000000,
    engine: "I4 2.0L Mild-Hybrid",
    seats: 5,
    fuelType: "Hybrid",
    year: 2024,
    imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=2070&auto=format&fit=crop",
    description: "Dòng SUV hạng sang cỡ trung bán chạy nhất, kết hợp hoàn hảo giữa thiết kế đẳng cấp, tiện nghi đỉnh cao và hiệu năng vận hành vượt trội.",
    isFeatured: true,
    isNew: true
  },
  {
    id: "c4",
    name: "Toyota Camry",
    brand: "Toyota",
    price: 1105000000,
    engine: "2.0L",
    seats: 5,
    fuelType: "Xăng",
    year: 2023,
    imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop",
    description: "Biểu tượng của sự sang trọng chuẩn mực, Toyota Camry mới mang ngôn ngữ thiết kế thanh lịch cùng không gian hàng ghế sau đẳng cấp thương gia.",
  },
  {
    id: "c5",
    name: "Porsche 911 Carrera",
    brand: "Porsche",
    price: 7600000000,
    engine: "V6 Twin-Turbo",
    seats: 2,
    fuelType: "Xăng",
    year: 2024,
    imageUrl: "https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=2070&auto=format&fit=crop",
    description: "Huyền thoại xe thể thao. Trải nghiệm lái phấn khích tột độ, thiết kế vượt thời gian, là khao khát của mọi tín đồ tốc độ.",
    isFeatured: true,
  }
];

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};
