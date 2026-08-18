export type GeoOption = {
  /** `zona:slug` | `municipio:slug` | `todas` */
  value: string;
  label: string;
};

export type MapaPin = {
  id: string;
  slug: string;
  titulo: string;
  lat: number;
  lng: number;
};
