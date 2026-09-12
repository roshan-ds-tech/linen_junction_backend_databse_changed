export interface Product {
  id: string;
  name: string;
  sku: string;
  pricePerMeter: number;
  category: string;
  clothType?: string;
  discountPrice?: number;
  availableLengths?: string[];
  colors?: string[];

  description?: string;
  image: string;
  images: string[]; // for backend URLs

  imageFiles?: File[]; // for upload

  inventory: {
    id?: string;
    color: string;
    gsm?: string;
    stock: number;
  }[];

  weight?: string;
}
export interface CartItem extends Product {
  product_id: string;
  name: string;
  selectedMeters: number;
  selectedColor?: string;
  addTailoringService: boolean;
  measurements?: Measurements;
  quantity: number;
  stitchingType?: string;
  stitchingPrice?: number;
}

export interface Measurements {
  chest?: string;
  waist?: string;
  hips?: string;
  shoulder?: string;
  length?: string;
  notes?: string;
}

export interface Order {
  id: string;
  customerName: string;
  date: string;
  total: number;
  status: string;
  shippingAddress: string;
  tailoringJobId?: string;
  items: CartItem[];
}

export interface TailoringJob {
  id: string;
  orderId: string;
  customerName: string;
  productName: string;
  productImage: string;
  measurements: Measurements;
  currentStatus: string;
  statusHistory: StatusUpdate[];
  examples?: PhotoDetail[];
  finishedProductImage?: PhotoDetail;
  tailorName?: string;
  stitchingType?: string | null;
  stitchingPrice?: number;
  priority?: string;
}

export interface PhotoDetail {
  id?: string;
  url: string;
  capturedAt: string;
  capturedBy: string; // Tailor Name or Customer Name
  customerDetails?: string;
  tailorDetails?: string;
}

export interface StatusUpdate {
  status: string;
  timestamp: string;
  note?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  isVip?: boolean;
}
