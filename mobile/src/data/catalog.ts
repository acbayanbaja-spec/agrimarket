export type PricePoint = {
  date: string
  price: number
}

export type Product = {
  id: string
  name: string
  category: string
  price: number
  unit: string
  stock: number
  rating: number
  reviews: number
  seller: string
  sellerId: string
  sellerUserId: number
  location: string
  image: string
  photos: string[]
  description: string
  organic: boolean
  tradeable: boolean
  lat: number
  lng: number
  priceHistory: PricePoint[]
  isUnlisted?: boolean
  isActive?: boolean
  availabilityStatus?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'temporarily_unavailable'
}

export const categories = [
  {
    "name": "Vegetables",
    "emoji": "🥬",
    "description": "Leafy greens, roots and daily harvests",
    "image": "/images/kangkong.jpg",
    "seller": "Green Valley Farm",
    "sellerUserId": 2
  },
  {
    "name": "Fruits",
    "emoji": "🥭",
    "description": "Seasonal fruits from local orchards",
    "image": "/images/mango.jpg",
    "seller": "Midsayap Gold Orchard",
    "sellerUserId": 13
  },
  {
    "name": "Rice",
    "emoji": "🌾",
    "description": "Dinorado, Sinandomeng, brown and black rice",
    "image": "/images/rice.jpg",
    "seller": "Tacurong Rice Mills",
    "sellerUserId": 15
  },
  {
    "name": "Grains",
    "emoji": "🌽",
    "description": "Yellow sweet corn, flint, feeds and grains",
    "image": "/images/corn.jpg",
    "seller": "Koronadal Grain Farms",
    "sellerUserId": 12
  },
  {
    "name": "Fish",
    "emoji": "🐟",
    "description": "Fresh catch and pond fish",
    "image": "/images/tilapia.jpg",
    "seller": "Lake Sebu Fisheries",
    "sellerUserId": 17
  },
  {
    "name": "Poultry",
    "emoji": "🐓",
    "description": "Chicken, pasture eggs, and duck",
    "image": "/images/eggs.jpg",
    "seller": "Koronadal Sunrise Poultry",
    "sellerUserId": 16
  },
  {
    "name": "Livestock",
    "emoji": "🐄",
    "description": "Farm-raised meat and dairy",
    "image": "/images/milk.jpg",
    "seller": "Surallah Dairy Farm",
    "sellerUserId": 18
  },
  {
    "name": "Farm Supplies",
    "emoji": "🧺",
    "description": "Tools, fertilizers, seeds and soil essentials",
    "image": "/images/compost.jpg",
    "seller": "Gensan Agri Supply",
    "sellerUserId": 14
  }
]

export function stockLabel(stock: number) {
  if (stock <= 0) return 'Out of stock'
  if (stock <= 20) return 'Low stock'
  return 'In stock'
}

export function stockTone(stock: number) {
  if (stock <= 0) return 'bg-red-100 text-red-800'
  if (stock <= 20) return 'bg-amber-100 text-amber-800'
  return 'bg-primary-100 text-primary-800'
}

export const products: Product[] = [
  {
    "id": "p-tomato",
    "name": "Salad Tomatoes",
    "category": "Vegetables",
    "price": 85,
    "unit": "kg",
    "stock": 120,
    "rating": 4.8,
    "reviews": 64,
    "seller": "Green Valley Farm",
    "sellerId": "seller-2",
    "sellerUserId": 2,
    "location": "Polomolok, South Cotabato",
    "image": "/images/tomato.jpg",
    "photos": [
      "/images/tomato.jpg",
      "/images/farm.jpg"
    ],
    "description": "Firm, sweet salad tomatoes harvested at dawn in Polomolok. Ideal for sinigang, salsa, and everyday cooking.",
    "organic": true,
    "tradeable": true,
    "lat": 6.2214,
    "lng": 125.0647,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 85
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-kangkong",
    "name": "Fresh Kangkong",
    "category": "Vegetables",
    "price": 35,
    "unit": "bundle",
    "stock": 45,
    "rating": 4.6,
    "reviews": 28,
    "seller": "Green Valley Farm",
    "sellerId": "seller-2",
    "sellerUserId": 2,
    "location": "Polomolok, South Cotabato",
    "image": "/images/kangkong.jpg",
    "photos": [
      "/images/kangkong.jpg"
    ],
    "description": "Crisp water spinach bunches washed and bundled the same morning.",
    "organic": true,
    "tradeable": true,
    "lat": 6.2214,
    "lng": 125.0647,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 35
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-ampalaya",
    "name": "Organic Ampalaya (Bitter Gourd)",
    "category": "Vegetables",
    "price": 75,
    "unit": "kg",
    "stock": 60,
    "rating": 4.8,
    "reviews": 47,
    "seller": "Green Valley Farm",
    "sellerId": "seller-2",
    "sellerUserId": 2,
    "location": "Polomolok, South Cotabato",
    "image": "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=600&auto=format&fit=crop&q=80",
    "photos": [
      "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Crisp green bitter melons cultivated without chemical sprays. Excellent for blood sugar management and ginisang ampalaya.",
    "organic": true,
    "tradeable": true,
    "lat": 6.2214,
    "lng": 125.0647,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 75
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-eggplant",
    "name": "Long Purple Eggplant (Talong)",
    "category": "Vegetables",
    "price": 60,
    "unit": "kg",
    "stock": 95,
    "rating": 4.7,
    "reviews": 32,
    "seller": "Green Valley Farm",
    "sellerId": "seller-2",
    "sellerUserId": 2,
    "location": "Polomolok, South Cotabato",
    "image": "https://images.unsplash.com/photo-1628773822503-930a84e930f7?w=600&auto=format&fit=crop&q=80",
    "photos": [
      "https://images.unsplash.com/photo-1628773822503-930a84e930f7?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Glossy, tender long purple eggplants picked fresh every morning. Perfect for tortang talong and pinakbet.",
    "organic": true,
    "tradeable": true,
    "lat": 6.2214,
    "lng": 125.0647,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 60
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-kalabasa",
    "name": "Supreme Squash (Kalabasa)",
    "category": "Vegetables",
    "price": 45,
    "unit": "kg",
    "stock": 110,
    "rating": 4.6,
    "reviews": 25,
    "seller": "Green Valley Farm",
    "sellerId": "seller-2",
    "sellerUserId": 2,
    "location": "Polomolok, South Cotabato",
    "image": "https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=600&auto=format&fit=crop&q=80",
    "photos": [
      "https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Thick, creamy yellow flesh squash with high carotene content. Great for ginataang kalabasa and healthy hearty stews.",
    "organic": true,
    "tradeable": true,
    "lat": 6.2214,
    "lng": 125.0647,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 45
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-lettuce",
    "name": "Hydroponic Romaine Lettuce",
    "category": "Vegetables",
    "price": 120,
    "unit": "pack",
    "stock": 60,
    "rating": 4.9,
    "reviews": 42,
    "seller": "Green Valley Farm",
    "sellerId": "seller-2",
    "sellerUserId": 2,
    "location": "Polomolok, South Cotabato",
    "image": "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=600&auto=format&fit=crop&q=80",
    "photos": [
      "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Crisp, sweet butterhead and romaine heads grown in pristine mountain water nutrient film technique (NFT). Zero soil grit.",
    "organic": true,
    "tradeable": true,
    "lat": 6.2214,
    "lng": 125.0647,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 120
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-mushroom",
    "name": "Fresh White Oyster Mushrooms",
    "category": "Vegetables",
    "price": 95,
    "unit": "pack",
    "stock": 40,
    "rating": 4.8,
    "reviews": 33,
    "seller": "Green Valley Farm",
    "sellerId": "seller-2",
    "sellerUserId": 2,
    "location": "Polomolok, South Cotabato",
    "image": "https://images.unsplash.com/photo-1509650969542-a083313eb6cb?w=600&auto=format&fit=crop&q=80",
    "photos": [
      "https://images.unsplash.com/photo-1509650969542-a083313eb6cb?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Succulent oyster mushrooms cultivated on pasteurized sawdust and rice bran substrate. Excellent vegan meat substitute.",
    "organic": true,
    "tradeable": true,
    "lat": 6.2214,
    "lng": 125.0647,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 95
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-onion",
    "name": "Red Creole Onions (Sibuyas)",
    "category": "Vegetables",
    "price": 130,
    "unit": "kg",
    "stock": 180,
    "rating": 4.8,
    "reviews": 76,
    "seller": "Green Valley Farm",
    "sellerId": "seller-2",
    "sellerUserId": 2,
    "location": "Polomolok, South Cotabato",
    "image": "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80",
    "photos": [
      "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Pungent, dry-cured red onions from local farms. Excellent keeping quality and savory richness.",
    "organic": false,
    "tradeable": true,
    "lat": 6.2214,
    "lng": 125.0647,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 130
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-garlic",
    "name": "Native White Garlic (Bawang)",
    "category": "Vegetables",
    "price": 190,
    "unit": "kg",
    "stock": 80,
    "rating": 4.9,
    "reviews": 52,
    "seller": "Green Valley Farm",
    "sellerId": "seller-2",
    "sellerUserId": 2,
    "location": "Polomolok, South Cotabato",
    "image": "https://images.unsplash.com/photo-1615477550927-6ec84459d249?w=600&auto=format&fit=crop&q=80",
    "photos": [
      "https://images.unsplash.com/photo-1615477550927-6ec84459d249?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Intensely fragrant native Philippine garlic cloves. Packed with natural allicin, vital for sautéing and home medicine.",
    "organic": true,
    "tradeable": true,
    "lat": 6.2214,
    "lng": 125.0647,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 190
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-ginger",
    "name": "Fresh Yellow Ginger (Luya)",
    "category": "Vegetables",
    "price": 110,
    "unit": "kg",
    "stock": 70,
    "rating": 4.7,
    "reviews": 38,
    "seller": "Green Valley Farm",
    "sellerId": "seller-2",
    "sellerUserId": 2,
    "location": "Polomolok, South Cotabato",
    "image": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80",
    "photos": [
      "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Spicy ginger rhizomes. Plump and fiber-rich, essential for tinola, salabat, and seafood marinades.",
    "organic": true,
    "tradeable": true,
    "lat": 6.2214,
    "lng": 125.0647,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 110
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "prod-1791732814162-2f8d",
    "name": "Highland Red Bell Peppers",
    "category": "Vegetables",
    "price": 140,
    "unit": "kg",
    "stock": 65,
    "rating": 5,
    "reviews": 0,
    "seller": "Green Valley Farm",
    "sellerId": "seller-2",
    "sellerUserId": 2,
    "location": "Polomolok, South Cotabato",
    "image": "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&auto=format&fit=crop&q=80",
    "photos": [
      "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Sweet, crisp bell peppers harvested fresh.",
    "organic": true,
    "tradeable": false,
    "lat": 6.2214,
    "lng": 125.0647,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 140
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-mango",
    "name": "Carabao Mangoes",
    "category": "Fruits",
    "price": 180,
    "unit": "kg",
    "stock": 60,
    "rating": 4.9,
    "reviews": 82,
    "seller": "Midsayap Gold Orchard",
    "sellerId": "seller-13",
    "sellerUserId": 13,
    "location": "Midsayap, Cotabato",
    "image": "/images/mango.jpg",
    "photos": [
      "/images/mango.jpg",
      "/images/farm.jpg"
    ],
    "description": "Export-grade sweet Carabao mangoes from Midsayap. Tree-ripened, golden yellow, and fragrant.",
    "organic": true,
    "tradeable": true,
    "lat": 7.1906,
    "lng": 124.5381,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 180
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-banana",
    "name": "Lakatan Bananas",
    "category": "Fruits",
    "price": 75,
    "unit": "kg",
    "stock": 50,
    "rating": 4.7,
    "reviews": 41,
    "seller": "Midsayap Gold Orchard",
    "sellerId": "seller-13",
    "sellerUserId": 13,
    "location": "Midsayap, Cotabato",
    "image": "/images/banana.jpg",
    "photos": [
      "/images/banana.jpg"
    ],
    "description": "Sweet, golden Lakatan bananas freshly harvested from orchards near Midsayap.",
    "organic": false,
    "tradeable": true,
    "lat": 7.1906,
    "lng": 124.5381,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 75
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-calamansi",
    "name": "Fresh Juicy Calamansi",
    "category": "Fruits",
    "price": 70,
    "unit": "kg",
    "stock": 85,
    "rating": 4.7,
    "reviews": 44,
    "seller": "Midsayap Gold Orchard",
    "sellerId": "seller-13",
    "sellerUserId": 13,
    "location": "Midsayap, Cotabato",
    "image": "/images/calamansi.jpg",
    "photos": [
      "/images/calamansi.jpg"
    ],
    "description": "High-yield aromatic calamansi from Midsayap orchards. Bursting with vitamin C for drinks and marinades.",
    "organic": true,
    "tradeable": true,
    "lat": 7.1906,
    "lng": 124.5381,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 70
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-durian",
    "name": "Fresh Puyat Durian",
    "category": "Fruits",
    "price": 240,
    "unit": "kg",
    "stock": 40,
    "rating": 5,
    "reviews": 94,
    "seller": "Midsayap Gold Orchard",
    "sellerId": "seller-13",
    "sellerUserId": 13,
    "location": "Midsayap, Cotabato",
    "image": "https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=600&auto=format&fit=crop&q=80",
    "photos": [
      "https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "King of Fruits! Creamy, bittersweet Puyat durian from volcanic soils in Cotabato.",
    "organic": true,
    "tradeable": true,
    "lat": 7.1906,
    "lng": 124.5381,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 240
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-mangosteen",
    "name": "Sweet Highland Mangosteen",
    "category": "Fruits",
    "price": 160,
    "unit": "kg",
    "stock": 50,
    "rating": 4.9,
    "reviews": 61,
    "seller": "Midsayap Gold Orchard",
    "sellerId": "seller-13",
    "sellerUserId": 13,
    "location": "Midsayap, Cotabato",
    "image": "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop&q=80",
    "photos": [
      "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Queen of Fruits! Juicy, snow-white arils packed with potent xanthones and natural antioxidants.",
    "organic": true,
    "tradeable": true,
    "lat": 7.1906,
    "lng": 124.5381,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 160
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-papaya",
    "name": "Red Lady Sweet Papaya",
    "category": "Fruits",
    "price": 55,
    "unit": "kg",
    "stock": 90,
    "rating": 4.7,
    "reviews": 49,
    "seller": "Midsayap Gold Orchard",
    "sellerId": "seller-13",
    "sellerUserId": 13,
    "location": "Midsayap, Cotabato",
    "image": "https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=600&auto=format&fit=crop&q=80",
    "photos": [
      "https://images.unsplash.com/photo-1526318896980-cf78c088247c?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Tree-ripened Red Lady hybrid papayas. Dense orange-red pulp, intensely sweet with very few seeds.",
    "organic": true,
    "tradeable": true,
    "lat": 7.1906,
    "lng": 124.5381,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 55
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-dragonfruit",
    "name": "Red Flesh Dragon Fruit",
    "category": "Fruits",
    "price": 150,
    "unit": "kg",
    "stock": 55,
    "rating": 4.9,
    "reviews": 63,
    "seller": "Midsayap Gold Orchard",
    "sellerId": "seller-13",
    "sellerUserId": 13,
    "location": "Midsayap, Cotabato",
    "image": "https://images.unsplash.com/photo-1527325678964-54921661f888?w=600&auto=format&fit=crop&q=80",
    "photos": [
      "https://images.unsplash.com/photo-1527325678964-54921661f888?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Vibrant magenta-fleshed pitahaya harvested at peak ripeness. Juicy, rich in dietary fiber and prebiotics.",
    "organic": true,
    "tradeable": true,
    "lat": 7.1906,
    "lng": 124.5381,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 150
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-rice",
    "name": "Dinorado Rice",
    "category": "Rice",
    "price": 58,
    "unit": "kg",
    "stock": 300,
    "rating": 4.9,
    "reviews": 110,
    "seller": "Tacurong Rice Mills",
    "sellerId": "seller-15",
    "sellerUserId": 15,
    "location": "Tacurong City, Sultan Kudarat",
    "image": "/images/rice.jpg",
    "photos": [
      "/images/rice.jpg"
    ],
    "description": "Aromatic whole-grain Dinorado rice from Tacurong plains. Soft, fluffy texture when cooked.",
    "organic": false,
    "tradeable": true,
    "lat": 6.6925,
    "lng": 124.6764,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 58
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-blackrice",
    "name": "Organic Black Rice (Tapol)",
    "category": "Rice",
    "price": 88,
    "unit": "kg",
    "stock": 150,
    "rating": 4.9,
    "reviews": 69,
    "seller": "Tacurong Rice Mills",
    "sellerId": "seller-15",
    "sellerUserId": 15,
    "location": "Tacurong City, Sultan Kudarat",
    "image": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80",
    "photos": [
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Ancestral heirloom black rice rich in anthocyanins. Nutty flavor, low glycemic index, favored by health enthusiasts.",
    "organic": true,
    "tradeable": true,
    "lat": 6.6925,
    "lng": 124.6764,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 88
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-corn",
    "name": "Sweet Yellow Corn",
    "category": "Grains",
    "price": 45,
    "unit": "kg",
    "stock": 80,
    "rating": 4.7,
    "reviews": 35,
    "seller": "Koronadal Grain Farms",
    "sellerId": "seller-12",
    "sellerUserId": 12,
    "location": "Koronadal City, South Cotabato",
    "image": "/images/corn.jpg",
    "photos": [
      "/images/corn.jpg"
    ],
    "description": "Juicy, golden sweet corn cobs from South Cotabato grain farms. Great for boiling or grilling.",
    "organic": false,
    "tradeable": true,
    "lat": 6.5004,
    "lng": 124.8436,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 45
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-tilapia",
    "name": "Lake Sebu Fresh Tilapia",
    "category": "Fish",
    "price": 160,
    "unit": "kg",
    "stock": 90,
    "rating": 4.9,
    "reviews": 67,
    "seller": "Lake Sebu Fisheries",
    "sellerId": "seller-17",
    "sellerUserId": 17,
    "location": "Lake Sebu, South Cotabato",
    "image": "/images/tilapia.jpg",
    "photos": [
      "/images/tilapia.jpg"
    ],
    "description": "Cold-water spring tilapia freshly harvested from Lake Sebu pens. Clean taste with no mud flavor.",
    "organic": true,
    "tradeable": false,
    "lat": 6.2255,
    "lng": 124.7088,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 160
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-bangus",
    "name": "Fresh Boneless Bangus",
    "category": "Fish",
    "price": 175,
    "unit": "kg",
    "stock": 85,
    "rating": 4.8,
    "reviews": 83,
    "seller": "Lake Sebu Fisheries",
    "sellerId": "seller-17",
    "sellerUserId": 17,
    "location": "Lake Sebu, South Cotabato",
    "image": "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600&auto=format&fit=crop&q=80",
    "photos": [
      "https://images.unsplash.com/photo-1534482421-64566f976cfa?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Plump Sarangani Bay milkfish, deboned and packed immediately on flake ice. Tender, rich belly fat.",
    "organic": false,
    "tradeable": true,
    "lat": 6.2255,
    "lng": 124.7088,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 175
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-chicken",
    "name": "Native Whole Chicken",
    "category": "Poultry",
    "price": 320,
    "unit": "kg",
    "stock": 25,
    "rating": 4.8,
    "reviews": 39,
    "seller": "Koronadal Sunrise Poultry",
    "sellerId": "seller-16",
    "sellerUserId": 16,
    "location": "Koronadal City, South Cotabato",
    "image": "/images/chicken.jpg",
    "photos": [
      "/images/chicken.jpg"
    ],
    "description": "Free-range native chicken raised on grass and corn. Superior taste and firmness for authentic tinola.",
    "organic": true,
    "tradeable": true,
    "lat": 6.5004,
    "lng": 124.8436,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 320
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-eggs",
    "name": "Free-Range Brown Eggs",
    "category": "Poultry",
    "price": 220,
    "unit": "tray",
    "stock": 75,
    "rating": 4.8,
    "reviews": 53,
    "seller": "Koronadal Sunrise Poultry",
    "sellerId": "seller-16",
    "sellerUserId": 16,
    "location": "Koronadal City, South Cotabato",
    "image": "/images/eggs.jpg",
    "photos": [
      "/images/eggs.jpg"
    ],
    "description": "Fresh pastured eggs from cage-free hens in Koronadal. Thick shells, rich orange yolks.",
    "organic": true,
    "tradeable": true,
    "lat": 6.5004,
    "lng": 124.8436,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 220
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-milk",
    "name": "Fresh Carabao Milk",
    "category": "Livestock",
    "price": 95,
    "unit": "liter",
    "stock": 35,
    "rating": 4.8,
    "reviews": 36,
    "seller": "Surallah Dairy Farm",
    "sellerId": "seller-18",
    "sellerUserId": 18,
    "location": "Surallah, South Cotabato",
    "image": "/images/milk.jpg",
    "photos": [
      "/images/milk.jpg"
    ],
    "description": "Creamy, unpasteurized natural carabao milk collected at 5:00 AM. Ideal for kesong puti and pasture pastillas.",
    "organic": true,
    "tradeable": true,
    "lat": 6.3753,
    "lng": 124.7456,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 95
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-fertilizer",
    "name": "Vermicast Organic Fertilizer",
    "category": "Farm Supplies",
    "price": 250,
    "unit": "sack",
    "stock": 65,
    "rating": 4.9,
    "reviews": 58,
    "seller": "Gensan Agri Supply",
    "sellerId": "seller-14",
    "sellerUserId": 14,
    "location": "General Santos City",
    "image": "/images/compost.jpg",
    "photos": [
      "/images/compost.jpg"
    ],
    "description": "100% pure worm castings (vermicompost). Highly concentrated microbial inoculant to revitalize garden and farm soil.",
    "organic": true,
    "tradeable": true,
    "lat": 6.1164,
    "lng": 125.1716,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 250
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-seeds",
    "name": "Hybrid Ampalaya Seeds",
    "category": "Farm Supplies",
    "price": 65,
    "unit": "pack",
    "stock": 140,
    "rating": 4.6,
    "reviews": 29,
    "seller": "Gensan Agri Supply",
    "sellerId": "seller-14",
    "sellerUserId": 14,
    "location": "General Santos City",
    "image": "/images/seeds.jpg",
    "photos": [
      "/images/seeds.jpg"
    ],
    "description": "High germination (92%) disease-resistant bitter gourd seeds. Tested for SOCCSKSARGEN highland and lowland plots.",
    "organic": true,
    "tradeable": true,
    "lat": 6.1164,
    "lng": 125.1716,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 65
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  },
  {
    "id": "p-honey",
    "name": "Pure Wild Forest Honey",
    "category": "Farm Supplies",
    "price": 320,
    "unit": "bottle",
    "stock": 45,
    "rating": 5,
    "reviews": 115,
    "seller": "Gensan Agri Supply",
    "sellerId": "seller-14",
    "sellerUserId": 14,
    "location": "General Santos City",
    "image": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80",
    "photos": [
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80"
    ],
    "description": "Raw, unheated multifloral wild bee honey harvested sustainably from forested slopes.",
    "organic": true,
    "tradeable": true,
    "lat": 6.1164,
    "lng": 125.1716,
    "priceHistory": [
      {
        "date": "2026-10-01",
        "price": 320
      }
    ],
    "isActive": true,
    "is_active": true,
    "isUnlisted": false,
    "isDeleted": false,
    "availabilityStatus": "in_stock"
  }
]

export const sellers = [
  {
    "id": "seller-1",
    "name": "Green Valley Farm",
    "location": "Polomolok, South Cotabato",
    "products": 8,
    "rating": 4.8,
    "sellerUserId": 2,
    "category": "Vegetables",
    "contactPerson": "Maria Santos",
    "email": "seller.vegetables@agrimarket.com"
  },
  {
    "id": "seller-2",
    "name": "Midsayap Gold Orchard",
    "location": "Midsayap, Cotabato",
    "products": 5,
    "rating": 4.9,
    "sellerUserId": 13,
    "category": "Fruits",
    "contactPerson": "Eduardo Dizon",
    "email": "seller.fruits@agrimarket.com"
  },
  {
    "id": "seller-3",
    "name": "Tacurong Rice Mills",
    "location": "Tacurong City, Sultan Kudarat",
    "products": 4,
    "rating": 4.8,
    "sellerUserId": 15,
    "category": "Rice",
    "contactPerson": "Lilia Mendoza",
    "email": "seller.rice@agrimarket.com"
  },
  {
    "id": "seller-4",
    "name": "Koronadal Grain Farms",
    "location": "Koronadal City, South Cotabato",
    "products": 2,
    "rating": 4.7,
    "sellerUserId": 12,
    "category": "Grains",
    "contactPerson": "Juanita Reyes",
    "email": "seller.grains@agrimarket.com"
  },
  {
    "id": "seller-5",
    "name": "Lake Sebu Fisheries",
    "location": "Lake Sebu, South Cotabato",
    "products": 3,
    "rating": 4.8,
    "sellerUserId": 17,
    "category": "Fish",
    "contactPerson": "Danilo Blaan",
    "email": "seller.fish@agrimarket.com"
  },
  {
    "id": "seller-6",
    "name": "Koronadal Sunrise Poultry",
    "location": "Koronadal City, South Cotabato",
    "products": 3,
    "rating": 4.8,
    "sellerUserId": 16,
    "category": "Poultry",
    "contactPerson": "Nestor Aquino",
    "email": "seller.poultry@agrimarket.com"
  },
  {
    "id": "seller-7",
    "name": "Surallah Dairy Farm",
    "location": "Surallah, South Cotabato",
    "products": 2,
    "rating": 4.8,
    "sellerUserId": 18,
    "category": "Livestock",
    "contactPerson": "Ramon Valdez",
    "email": "seller.livestock@agrimarket.com"
  },
  {
    "id": "seller-8",
    "name": "Gensan Agri Supply",
    "location": "General Santos City",
    "products": 2,
    "rating": 4.7,
    "sellerUserId": 14,
    "category": "Farm Supplies",
    "contactPerson": "Roberto Tan",
    "email": "seller.supplies@agrimarket.com"
  }
]

export const shippingCoupons = [
  { code: 'FREESHIP', description: 'Free shipping on ₱300+ inside SOCCSKSARGEN', type: 'fixed' as const, value: 50, minOrder: 300 },
  { code: 'AGRIFARM30', description: '₱30 off fresh vegetables voucher', type: 'fixed' as const, value: 30, minOrder: 150 },
  { code: 'COINBACK10', description: '10% Coins Cashback voucher', type: 'percent' as const, value: 10, minOrder: 200 },
  { code: 'HARVEST50', description: '₱50 off on orders ₱450+', type: 'fixed' as const, value: 50, minOrder: 450 },
]
