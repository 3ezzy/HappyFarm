import { useEffect, useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { animalService } from '../../services/api/animals.js'
import AnimalIcon from '../../components/common/AnimalIcon.jsx'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import { HfInput, TYPES, speciesBgClass, ageText, badge, cardClass } from '../../theme/hf.jsx'

const addBtnClass =
  'inline-flex cursor-pointer items-center gap-2 rounded-full border-none bg-brown px-6 py-3 ' +
  'font-display text-[15px] font-bold text-white shadow-soft transition-all duration-200 ease-pop ' +
  'hover:scale-[1.04] hover:bg-brown-dark'

const filterClass = (active) =>
  classNames(
    'cursor-pointer rounded-full border-2 px-4 py-[7px] font-sans text-[13.5px] font-semibold transition-all duration-200',
    active ? 'border-green bg-green text-white' : 'border-line bg-cream text-brown'
  )

/** Debounce a fast-changing value so search doesn't fire a request per keystroke. */
function useDebounced(value, delayMs) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(id)
  }, [value, delayMs])
  return debounced
}

const Animals = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounced(search.trim(), 300)

  const FILTERS = [
    { key: 'all', label: t('animals.filters.all') },
    { key: 'active', label: t('animals.filters.active') },
    { key: 'sacrificed', label: t('animals.filters.sacrificed') },
    { key: 'sheep', label: t('animals.filters.sheep') },
    { key: 'goat', label: t('animals.filters.goats') },
    { key: 'cow', label: t('animals.filters.cows') },
    { key: 'camel', label: t('animals.filters.camels') },
  ]

  const { data: animals = [], isLoading } = useQuery(
    ['animals', debouncedSearch],
    () => animalService.getAll(debouncedSearch || undefined),
    { refetchOnWindowFocus: true, refetchInterval: 30000 }
  )

  let list = animals.slice()
  if (filter === 'active') list = list.filter((a) => !a.is_sacrificed)
  else if (filter === 'sacrificed') list = list.filter((a) => a.is_sacrificed)
  else if (TYPES.includes(filter)) list = list.filter((a) => a.type === filter)

  const emptyMessage = debouncedSearch ? t('animals.noneMatchSearch') : t('animals.noneFound')

  return (
    <div className="animate-hf-pop">
      <div className="mb-[22px] flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[34px]">{t('animals.title')}</h1>
        <button onClick={() => navigate('/animals/add')} className={addBtnClass}>
          {t('animals.addAnimal')} <span className="text-lg rtl:rotate-180">→</span>
        </button>
      </div>

      <HfInput
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('animals.searchPlaceholder')}
        className="mb-4 max-w-sm"
      />

      <div className="mb-[22px] flex flex-wrap gap-[9px]">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={filterClass(filter === f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="large" message={t('common.loading')} />
        </div>
      ) : list.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
          {list.map((a) => (
            <button
              key={a.id}
              onClick={() => navigate(`/animals/${a.id}`)}
              className={classNames(cardClass, 'cursor-pointer border-none p-5 text-start transition-all duration-200 ease-pop hover:scale-[1.02] hover:shadow-toast')}
            >
              <div className="mb-3.5 flex items-center gap-3.5">
                <span className={classNames('inline-flex h-[62px] w-[62px] flex-none items-center justify-center rounded-2xl', speciesBgClass(a.type))}>
                  <AnimalIcon type={a.type} size={54} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-xl leading-tight">{a.name}</h3>
                  <p className="mt-0.5 text-sm text-tan">{t(`species.${a.type}.label`)} · {ageText(a.age, t)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                {a.is_sacrificed ? (
                  <span className={badge('sacrificed')}>{t('animals.filters.sacrificed')}</span>
                ) : (
                  <span className={badge('active')}>{t('animals.filters.active')}</span>
                )}
                {a.is_eligible && <span className={badge('eligible')}>{t('animals.eligible')}</span>}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className={classNames(cardClass, 'px-6 py-14 text-center')}>
          <div className="mx-auto mb-3 h-[90px] w-[90px]">
            <AnimalIcon type="sheep" size={90} />
          </div>
          <h3 className="mb-2 text-2xl">{emptyMessage}</h3>
          <p className="mb-5 text-tan">{t('animals.tryAnotherFilter')}</p>
          <button onClick={() => navigate('/animals/add')} className={addBtnClass}>
            {t('animals.addAnimal')} <span className="text-lg rtl:rotate-180">→</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default Animals
