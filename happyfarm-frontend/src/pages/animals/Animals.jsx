import { useEffect, useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { animalService } from '../../services/api/animals.js'
import AnimalIcon from '../../components/common/AnimalIcon.jsx'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import { HfInput, TYPES, speciesBgClass, ageText, Pill, EarTag, Eligibility, EmptyState, btnPrimary } from '../../theme/hf.jsx'

const filterClass = (active) =>
  classNames(
    'cursor-pointer rounded-pill border px-4 py-[7px] font-sans text-[13.5px] font-medium transition-colors duration-hf',
    active ? 'border-meadow-700 bg-meadow-700 text-white' : 'border-line-strong bg-surface-card text-ink-700'
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

const statusPill = (a, t) => {
  if (a.is_archived) return <Pill tone="hold">{t('animals.filters.archived')}</Pill>
  if (a.is_sacrificed) return <Pill tone="hold">{t('animals.filters.sacrificed')}</Pill>
  return <Pill tone="ok">{t('animals.filters.active')}</Pill>
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
    { key: 'pregnant', label: t('animals.filters.pregnant') },
    { key: 'nursing', label: t('animals.filters.nursing') },
    { key: 'available', label: t('animals.filters.available') },
    { key: 'archived', label: t('animals.filters.archived') },
    { key: 'sheep', label: t('animals.filters.sheep') },
    { key: 'goat', label: t('animals.filters.goats') },
    { key: 'cow', label: t('animals.filters.cows') },
    { key: 'camel', label: t('animals.filters.camels') },
  ]
  const BREEDING_FILTERS = ['pregnant', 'nursing', 'available']

  // Archived animals are excluded by the backend's default query entirely
  // (not just a client-side filter) — selecting this filter re-fetches
  // with ?archived=1 instead of filtering an already-fetched list.
  const showingArchived = filter === 'archived'

  const { data: animals = [], isLoading } = useQuery(
    ['animals', debouncedSearch, showingArchived],
    () => animalService.getAll({ search: debouncedSearch || undefined, archived: showingArchived }),
    { refetchOnWindowFocus: true, refetchInterval: 30000 }
  )

  let list = animals.slice()
  if (filter === 'active') list = list.filter((a) => !a.is_sacrificed)
  else if (filter === 'sacrificed') list = list.filter((a) => a.is_sacrificed)
  else if (BREEDING_FILTERS.includes(filter)) list = list.filter((a) => a.breeding_status === filter)
  else if (TYPES.includes(filter)) list = list.filter((a) => a.type === filter)
  // 'archived' needs no client-side filtering — the query itself already
  // returned only archived animals.

  const emptyMessage = debouncedSearch ? t('animals.noneMatchSearch') : t('animals.noneFound')

  return (
    <div>
      <div className="mb-[22px] flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[34px] text-ink-900">{t('animals.title')}</h1>
        <button onClick={() => navigate('/animals/add')} className={btnPrimary}>
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
        <div className="hf-tablewrap">
          <div className="hf-scroll">
            <table className="hf-table">
              <thead>
                <tr>
                  <th>{t('addAnimal.tag')}</th>
                  <th>{t('addAnimal.name')}</th>
                  <th>{t('addAnimal.animalType')}</th>
                  <th>{t('addAnimal.sex')}</th>
                  <th className="num">{t('animals.ageHeader')}</th>
                  <th>{t('animals.eligible')}</th>
                  <th>{t('animals.statusHeader')}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.id} onClick={() => navigate(`/animals/${a.id}`)} className="cursor-pointer">
                    <td><EarTag species={a.type} tag={a.tag} archived={a.is_sacrificed} /></td>
                    <td>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/animals/${a.id}`) }}
                        className="flex cursor-pointer items-center gap-2.5 border-none bg-transparent p-0 text-start font-display text-[15px] font-semibold text-ink-900 underline-offset-2 hover:underline"
                      >
                        <span className={classNames('inline-flex h-8 w-8 flex-none items-center justify-center rounded', speciesBgClass(a.type))}>
                          <AnimalIcon type={a.type} size={22} />
                        </span>
                        {a.name}
                      </button>
                    </td>
                    <td className="text-ink-700">{t(`species.${a.type}.label`)}</td>
                    <td className="text-ink-700">{a.sex ? t(`addAnimal.${a.sex}`) : '—'}</td>
                    <td className="num text-ink-700">{ageText(a.age, t)}</td>
                    <td>
                      <Eligibility
                        eligible={a.is_eligible}
                        label={a.is_eligible ? t('animals.eligible') : t('dashboard.notYetEligible')}
                      />
                    </td>
                    <td>{statusPill(a, t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<div className="mx-auto mb-1 h-[64px] w-[64px]"><AnimalIcon type="sheep" size={64} /></div>}
          title={emptyMessage}
          body={t('animals.tryAnotherFilter')}
          action={
            <button onClick={() => navigate('/animals/add')} className={btnPrimary}>
              {t('animals.addAnimal')} <span className="text-lg rtl:rotate-180">→</span>
            </button>
          }
        />
      )}
    </div>
  )
}

export default Animals
