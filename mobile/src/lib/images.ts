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
  if (!src) return photos.farm
  const key = src.replace(/^\/images\//, '').replace(/\.(jpg|jpeg|png|webp|svg)$/i, '')
  return photos[key] || photos.farm
}
