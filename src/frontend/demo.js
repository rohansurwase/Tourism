export const demoCenter = { name: 'Paris', lat: 48.8566, lon: 2.3522 };
export const demoPlaces = [
  ['notre-dame', 'Notre-Dame de Paris', 48.8530, 2.3499, 'cathedral', 'Île de la Cité, Paris', 'A Gothic cathedral on the Île de la Cité.', 'tourism.sights.place_of_worship.cathedral'],
  ['sainte-chapelle', 'Sainte-Chapelle', 48.8554, 2.3450, 'chapel', 'Boulevard du Palais, Paris', 'A royal chapel known for its stained-glass windows.', 'tourism.sights.place_of_worship.chapel'],
  ['louvre', 'Louvre Museum', 48.8606, 2.3376, 'museum', 'Rue de Rivoli, Paris', 'An art museum in a former royal palace.', 'entertainment.museum'],
  ['luxembourg', 'Jardin du Luxembourg', 48.8462, 2.3372, 'park', '6th arrondissement, Paris', 'Formal gardens surrounding the Luxembourg Palace.', 'leisure.park'],
  ['orsay', "Musée d’Orsay", 48.8600, 2.3266, 'museum', 'Esplanade Valéry Giscard d’Estaing, Paris', 'An art museum housed in a former railway station.', 'entertainment.museum'],
  ['triomphe', 'Arc de Triomphe', 48.8738, 2.2950, 'monument', 'Place Charles de Gaulle, Paris', 'A monumental arch at the western end of the Champs-Élysées.', 'tourism.sights.memorial.monument']
].map(([id, name, lat, lon, kind, address, description, category]) => ({id, name, lat, lon, kind, address, description, categories: [category], website: null, hours: ''}));
