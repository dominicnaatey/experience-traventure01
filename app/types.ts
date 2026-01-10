
export interface Destination {
  id: string;
  name: string;
  country: string;
  tourCount: number;
  imageUrl: string;
}

export interface TourPackage {
  id: string;
  title: string;
  location: string;
  duration: string;
  price: number;
  rating: number;
  description: string;
  imageUrl: string;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  comment: string;
  avatar: string;
}

export interface SearchResult {
  text: string;
  sources: Array<{ web?: { uri: string; title: string }; maps?: { uri: string; title: string } }>;
}
