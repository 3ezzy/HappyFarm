import { ANIMAL_TYPES } from './animalTypes.js'

export const SACRIFICE_RULES = {
  [ANIMAL_TYPES.SHEEP]: {
    minAge: 0.5, // 6 months
    label: '6 months',
    labelAr: '6 أشهر',
    description: 'Sheep must be at least 6 months old for sacrifice.',
    descriptionAr: 'يجب أن يكون عمر الضأن 6 أشهر على الأقل للذبح.'
  },
  [ANIMAL_TYPES.GOAT]: {
    minAge: 1, // 1 year
    label: '1 year',
    labelAr: 'سنة واحدة',
    description: 'Goat must be at least 1 year old for sacrifice.',
    descriptionAr: 'يجب أن يكون عمر الماعز سنة واحدة على الأقل للذبح.'
  },
  [ANIMAL_TYPES.COW]: {
    minAge: 2, // 2 years
    label: '2 years',
    labelAr: 'سنتان',
    description: 'Cow must be at least 2 years old for sacrifice.',
    descriptionAr: 'يجب أن يكون عمر البقرة سنتان على الأقل للذبح.'
  },
  [ANIMAL_TYPES.CAMEL]: {
    minAge: 5, // 5 years
    label: '5 years',
    labelAr: '5 سنوات',
    description: 'Camel must be at least 5 years old for sacrifice.',
    descriptionAr: 'يجب أن يكون عمر الجمل 5 سنوات على الأقل للذبح.'
  }
}

export const isEligibleForSacrifice = (animalType, age) => {
  const rule = SACRIFICE_RULES[animalType]
  if (!rule) return false
  return age >= rule.minAge
}

export const getSacrificeRule = (animalType) => {
  return SACRIFICE_RULES[animalType] || null
}

export const getSacrificeEligibilityMessage = (animalType, age, isEligible) => {
  const rule = SACRIFICE_RULES[animalType]
  if (!rule) return 'Unknown animal type'
  
  if (isEligible) {
    return `This ${animalType} is eligible for sacrifice (${age} years ≥ ${rule.label})`
  } else {
    return `This ${animalType} is not yet eligible for sacrifice (${age} years < ${rule.label})`
  }
} 