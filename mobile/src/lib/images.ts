import type { ImageSourcePropType } from 'react-native'

const photos: Record<string, ImageSourcePropType> = {
  banana: require('../../assets/images/banana.jpg'),
  calamansi: require('../../assets/images/calamansi.jpg'),
  chicken: require('../../assets/images/chicken.jpg'),
  compost: require('../../assets/images/compost.jpg'),
  corn: require('../../assets/images/corn.jpg'),
  eggs: require('../../assets/images/eggs.jpg'),
  farm: require('../../assets/images/farm.jpg'),
  hero: require('../../assets/images/hero.jpg'),
  kangkong: require('../../assets/images/kangkong.jpg'),
  mango: require('../../assets/images/mango.jpg'),
  milk: require('../../assets/images/milk.jpg'),
  rice: require('../../assets/images/rice.jpg'),
  seeds: require('../../assets/images/seeds.jpg'),
  tilapia: require('../../assets/images/tilapia.jpg'),
  tomato: require('../../assets/images/tomato.jpg'),
}

export function productPhoto(src?: string): ImageSourcePropType {
  if (!src) return photos.farm;
  if (typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:'))) {
    return { uri: src };
  }
  const clean = src.replace(/^\/images\//, '').replace(/\.(jpg|jpeg|png|webp|svg)$/i, '').toLowerCase();
  if (photos[clean]) return photos[clean];

  // Smart fallback mapping for local display
  if (clean.includes('durian') || clean.includes('mango') || clean.includes('papaya')) return photos.mango;
  if (clean.includes('banana') || clean.includes('dragon')) return photos.banana;
  if (clean.includes('eggplant') || clean.includes('talong') || clean.includes('onion') || clean.includes('tomato')) return photos.tomato;
  if (clean.includes('kangkong') || clean.includes('ampalaya') || clean.includes('lettuce')) return photos.kangkong;
  if (clean.includes('corn') || clean.includes('kalabasa')) return photos.corn;
  if (clean.includes('rice') || clean.includes('grain')) return photos.rice;
  if (clean.includes('honey') || clean.includes('compost') || clean.includes('fertilizer')) return photos.compost;
  if (clean.includes('bangus') || clean.includes('fish') || clean.includes('tilapia')) return photos.tilapia;
  if (clean.includes('calamansi') || clean.includes('citrus')) return photos.calamansi;
  if (clean.includes('egg')) return photos.eggs;
  if (clean.includes('chicken') || clean.includes('poultry')) return photos.chicken;
  if (clean.includes('milk') || clean.includes('carabao')) return photos.milk;
  if (clean.includes('seed') || clean.includes('mushroom') || clean.includes('garlic')) return photos.seeds;

  return photos.farm;
}
