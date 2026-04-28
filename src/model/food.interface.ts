export interface Variant {
  variantId: string;
  label: string;
  price: number;
  available: boolean;
}

export interface Addon {
  addonId: string;
  name: string;
  price: number;
  available: boolean;
}

export interface foodInterface {
  id: string;
  name: string;
  image: string;
  description?: string;
  veg: boolean;
  quantity: number;
  price: number;
  enabled: boolean;
  categoryId: string;
  variants?: Variant[];


  addons?: Addon[];
  mealType?: string;
  cuisine?: string;
  rating?: number;
  reviewCount?: number;
}
