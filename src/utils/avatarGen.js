// Avatar generation utility - maps user IDs to avatar names and SVG paths
const avatars = [
  { name: "Panicky Panda", id: 1 },
  { name: "Lawless Lion", id: 2 },
  { name: "Terrific Tiger", id: 3 },
  { name: "Baffling Bear", id: 4 },
  { name: "Paltry Parrot", id: 5 },
  { name: "Radical Rabbit", id: 6 },
  { name: "Callous Chameleon", id: 7 },
  { name: "Slow Sloth", id: 8 },
  { name: "Eccentric Elk", id: 9 },
  { name: "Lame Llama", id: 10 },
  { name: "Able Anteater", id: 11 },
  { name: "Edgy Eagle", id: 12 },
  { name: "Crispy Crocodile", id: 13 },
  { name: "Ballistic Beaver", id: 14 },
  { name: "Hasty Hamster", id: 15 },
  { name: "Witty Walrus", id: 16 },
  { name: "Bearded Bear", id: 17 },
  { name: "Cosmic Cheetah", id: 18 },
  { name: "Keen Kangaroo", id: 19 },
  { name: "Deadly Duck", id: 20 },
  { name: "Gaudy Goose", id: 21 },
  { name: "Leisurely Lemur", id: 22 },
  { name: "Odd Ostrich", id: 23 },
  { name: "Ominous Owl", id: 24 },
  { name: "Bipolar Boar", id: 25 },
  { name: "Picky Penguin", id: 26 },
  { name: "Cagey Camel", id: 27 },
  { name: "Rational Raccoon", id: 28 },
  { name: "Heavy Hippo", id: 29 },
  { name: "Manic Monkey", id: 30 },
  { name: "Martial Meerkat", id: 31 },
  { name: "Slithering Snake", id: 32 },
  { name: "Zesty Zebra", id: 33 },
  { name: "Defunct Donkey", id: 34 },
  { name: "Blind Bull", id: 35 },
  { name: "Giggly Goat", id: 36 },
  { name: "Gifted Goat", id: 37 },
  { name: "Handy Horse", id: 38 },
  { name: "Wacky Wolf", id: 39 },
  { name: "Kind Koala", id: 40 },
  { name: "High Hedgehog", id: 41 },
  { name: "Futile Frog", id: 42 },
  { name: "Timeless Turtle", id: 43 },
  { name: "Gentle Gorilla", id: 44 },
  { name: "Giant Giraffe", id: 45 },
  { name: "Dashing Deer", id: 46 },
  { name: "Rowdy Rhino", id: 47 },
  { name: "Elite Elephant", id: 48 },
  { name: "Pacey Puma", id: 49 },
  { name: "Finicky Fox", id: 50 },
]

export function getAvatarInfo(index) {
  // Ensure index is within bounds
  const safeIndex = ((index - 1) % avatars.length + avatars.length) % avatars.length
  const avatar = avatars[safeIndex]
  
  return {
    name: avatar.name,
    path: `/src/assets/avatars/${avatar.id}-${avatar.name.toLowerCase().replace(/\s+/g, '')}.svg`,
    initial: avatar.name.charAt(0),
    id: avatar.id
  }
}

export function getAvatarColor(index) {
  const colors = [
    '#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16'
  ]
  return colors[(index - 1) % colors.length]
}
