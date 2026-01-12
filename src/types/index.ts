export interface Watch {
  id?: string;
  name: string;
  brand: string;
  price: number;
  description: string;
  imageUrl: string;
  stock: number;
  category: 'luxo' | 'desportivo' | 'casual';
}