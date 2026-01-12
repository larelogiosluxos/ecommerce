export interface Watch {
  id?: string;
  brand: string;   // Marca (ex: Rolex, Omega)
  model: string;   // Modelo
  price: number;   // Preço
  imageUrl: string; // Link da foto no Firebase Storage
  description: string;
  stock: number;
}