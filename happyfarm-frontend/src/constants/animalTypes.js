export const ANIMAL_TYPES = {
  SHEEP: 'sheep',
  GOAT: 'goat',
  COW: 'cow',
  CAMEL: 'camel'
}

export const ANIMAL_TYPE_OPTIONS = [
  {
    value: ANIMAL_TYPES.SHEEP,
    label: 'Sheep',
    labelAr: 'الضأن (غنم)',
    icon: '🐑',
    color: 'text-blue-600'
  },
  {
    value: ANIMAL_TYPES.GOAT,
    label: 'Goat',
    labelAr: 'الماعز',
    icon: '🐐',
    color: 'text-green-600'
  },
  {
    value: ANIMAL_TYPES.COW,
    label: 'Cow',
    labelAr: 'البقر',
    icon: '🐄',
    color: 'text-red-600'
  },
  {
    value: ANIMAL_TYPES.CAMEL,
    label: 'Camel',
    labelAr: 'الإبل',
    icon: '🐪',
    color: 'text-yellow-600'
  }
]

export const getAnimalTypeInfo = (type) => {
  return ANIMAL_TYPE_OPTIONS.find(option => option.value === type)
} 