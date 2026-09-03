export interface Place {
  id: number;
  name: string;
  typeId: number;
  categoryId: number;
  countryId: number;
  regionId: number;
  cityId: number;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  rating?: number;
  description?: string;
}
