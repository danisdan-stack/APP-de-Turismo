export const PROVINCIAS = [
  { nombre: "Ciudad de Buenos Aires", iso: "AR-C" },
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

export const CATEGORIAS_OVERPASS = {
  naturaleza: {
    tags: ['natural'],
    tipos: [
      'wood', 'water', 'peak', 'volcano', 'cliff', 'beach', 'bay', 
      'spring', 'cave_entrance', 'stone', 'glacier',
      'ridge', 'valley', 'saddle', 'arete', 'gorge', 'canyon',
      'river', 'stream', 'waterfall', 'rapids', 'lake', 'pond', 
      'reservoir', 'wetland', 'marsh', 'bog',
      'rock', 'scree', 'shingle', 'sand', 'dune', 'hill',
      'crevasse', 'moraine', 'karst', 'sinkhole',
      'tree_row', 'hedge', 'scrub', 'heath', 'grassland', 'meadow',
      'fell', 'tundra', 'bare_rock',
      'salt_pond', 'salt_marsh',      
      'geyser', 'hot_spring',         
      'caldera', 'crater',         
      'peninsula', 'cape', 'isthmus', 
      'reef', 'shoal',          
      'mud', 'fen', 'swamp', 'reedbed',
      'ice_shelf', 'snowfield', 'firn',
      'cave', 'pothole', 'sink'
    ]
  },
  turismo: {
    tags: ['tourism'],
    tipos: [
      'hotel', 'attraction', 'museum', 'artwork', 'viewpoint',
      'theme_park', 'gallery', 'aquarium', 'information',
      'guest_house', 'hostel', 'apartment', 'camp_site', 'caravan_site',
      'chalet', 'resort', 'motel', 'bed_and_breakfast',
      'zoo', 'theme_park', 'water_park', 'adventure_park',
      'picnic_site', 'wildlife_hide', 'bird_hide',
      'archaeological_site', 'historic_site', 'monument', 'memorial',
      'battlefield', 'fort', 'castle', 'ruins',
      'religious_site', 'shrine', 'altar',
      'ski_resort', 'trail_riding_station', 'climbing_adventure',
      'information_office', 'information_board', 'information_guidepost',
      'map', 'guidepost',
      'estancia_turistica',
      'bodega',
      'bodega_visita',
      'termas',
      'balneario',
      'parque_nacional',
      'reserva_natural',
      'mirador',
      'feria_artesanal',
      'casa_historica',
      'faro',
      'cabalgata',
      'pesca_deportiva',
      'observatorio',
      'caminito',
      'tren_turistico',
      'restaurant', 'cafe', 'bar', 'pub', 
      'food_court', 'food_truck', 'ice_cream',
      'winery', 'vineyard', 'wine_cellar', 'wine_bar',
      'adventure_park', 'climbing', 'rafting', 'kayaking',
      'trekking', 'zip_line', 'paragliding', 'hang_gliding',
      'farmstay', 'ranch', 'agritourism', 'rural_cabin',
      'festival_grounds', 'exhibition_centre', 'conference_centre',
      'events_venue', 'fairground',
      'gift', 'souvenir', 'art', 'craft', 'jewelry',
      'leather', 'wool', 'regional_products'
    ]
  },
  alojamiento: {
    tags: ['tourism', 'amenity'],
    tipos: ['hotel', 'hostel', 'guest_house', 'motel', 'apartment', 'camp_site']
  }
};

export const PAISAJES_OVERPASS = {
  "cerros_y_montañas": {
    tags: ['natural'],
    tipos: ['peak', 'volcano', 'ridge', 'cliff', 'valley', 'arete', 'saddle', 'hill', 'mountain']
  },
  "rios_y_mar": {
    tags: ['natural', 'waterway'],
    tipos: [
      'water', 'spring', 'river', 'stream', 'canal', 'waterfall', 
      'lake', 'pond', 'reservoir', 'bay', 'beach', 'sea', 'ocean', 'coastline'
    ]
  }
};

export const OVERPASS_CONFIG = {
  url: "https://overpass-api.de/api/interpreter",
  timeout: 180,
  maxElements: 1000
};

export const TIPOS_ELEMENTOS = ['node', 'way', 'relation'];