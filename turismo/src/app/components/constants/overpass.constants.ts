// ====== Provincias de Argentina con códigos ISO ======
export const PROVINCIAS = [
  { nombre: "Buenos Aires", iso: "AR-B" },
  { nombre: "Córdoba", iso: "AR-X" },
  { nombre: "Mendoza", iso: "AR-M" },
  { nombre: "Santa Fe", iso: "AR-SF" },
  { nombre: "Tucumán", iso: "AR-T" },
  { nombre: "Salta", iso: "AR-A" },
  { nombre: "Jujuy", iso: "AR-Y" },
  { nombre: "La Rioja", iso: "AR-F" },
  { nombre: "San Juan", iso: "AR-J" },
  { nombre: "San Luis", iso: "AR-D" },
  { nombre: "Entre Ríos", iso: "AR-E" },
  { nombre: "Chaco", iso: "AR-H" },
  { nombre: "Corrientes", iso: "AR-W" },
  { nombre: "Formosa", iso: "AR-P" },
  { nombre: "Misiones", iso: "AR-N" },
  { nombre: "Neuquén", iso: "AR-Q" },
  { nombre: "Río Negro", iso: "AR-R" },
  { nombre: "Chubut", iso: "AR-U" },
  { nombre: "Santa Cruz", iso: "AR-Z" },
  { nombre: "Tierra del Fuego", iso: "AR-V" },
  { nombre: "Catamarca", iso: "AR-K" },
  { nombre: "La Pampa", iso: "AR-L" },
  { nombre: "Santiago del Estero", iso: "AR-G" }
];

// ====== Categorías y sus correspondencias en Overpass ======
export const CATEGORIAS_OVERPASS = {
  naturaleza: {
    tags: ['natural'],
    tipos: [
      'wood', 'water', 'peak', 'volcano', 'cliff', 'beach', 'bay', 
      'spring', 'cave_entrance', 'tree', 'stone', 'glacier'
    ]
  },
  turismo: {
    tags: ['tourism'],
    tipos: [
      'hotel', 'attraction', 'museum', 'artwork', 'viewpoint', 'zoo',
      'theme_park', 'gallery', 'aquarium', 'information'
    ]
  },
  alojamiento: {
    tags: ['tourism', 'amenity'],
    tipos: ['hotel', 'hostel', 'guest_house', 'motel', 'apartment', 'camp_site']
  }
};

// ====== Paisajes y sus correspondencias en Overpass ======
export const PAISAJES_OVERPASS = {
  montañas: {
    tags: ['natural'],
    tipos: ['peak', 'volcano', 'ridge', 'cliff', 'valley', 'arete', 'saddle']
  },
  agua: {
    tags: ['natural', 'waterway'],
    tipos: [
      'water', 'spring', 'river', 'stream', 'canal', 'waterfall', 
      'lake', 'pond', 'reservoir', 'bay', 'beach'
    ]
  }
};

// ====== Configuración de Overpass ======
export const OVERPASS_CONFIG = {
  url: "https://overpass-api.de/api/interpreter",
  timeout: 60,
  maxElements: 1000
};

// ====== Tipos de elementos en Overpass ======
export const TIPOS_ELEMENTOS = ['node', 'way', 'relation'];