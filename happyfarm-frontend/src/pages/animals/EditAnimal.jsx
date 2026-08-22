import { useEffect, useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { animalService } from '../../services/api/animals.js'
import { breedService } from '../../services/api/breeds.js'
import AnimalIcon from '../../components/common/AnimalIcon.jsx'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import { HfInput, HfSelect, TYPES } from '../../theme/hf.jsx'
import { apiErrorMessage } from '../../utils/apiError.js'

const backBtnClass =
  'mb-5 inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-line bg-cream ' +
  'px-[18px] py-2 font-display text-sm font-bold text-brown-text ' +
  'transition-transform duration-200 ease-pop hover:scale-[1.04]'

const choiceClass = (active, disabled) =>
  classNames(
    'flex flex-col items-center rounded-2xl border-2 px-2 py-3.5 transition-all duration-200 ease-pop',
    disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
    active ? 'border-green bg-green-soft shadow-ribbon' : 'border-transparent bg-sand'
  )

const toggleOptionClass = (active) =>
  classNames(
    'flex-1 cursor-pointer rounded-full border-2 px-3 py-2 text-center font-sans text-[13.5px] font-semibold transition-all duration-200',
    active ? 'border-green bg-green text-white' : 'border-line bg-cream text-brown'
  )

const labelClass = 'mb-2 block text-sm font-semibold text-brown-text'
const fieldGroupClass = 'mb-[18px]'

const EditAnimal = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: animal, isLoading } = useQuery(['animal', id], () => animalService.getById(id))
  const { data: animals = [] } = useQuery('animals', () => animalService.getAll())

  const [type, setType] = useState('sheep')
  const [name, setName] = useState('')
  const [tag, setTag] = useState('')
  const [breedId, setBreedId] = useState('')
  const [sex, setSex] = useState('')
  const [knowsDob, setKnowsDob] = useState(true)
  const [dob, setDob] = useState('')
  const [age, setAge] = useState('')
  const [datePurchased, setDatePurchased] = useState('')
  const [origin, setOrigin] = useState('')
  const [damId, setDamId] = useState('')
  const [sireId, setSireId] = useState('')
  const [initialized, setInitialized] = useState(false)

  // Pre-fill once the animal loads. Prefers date_of_birth (already known
  // precisely) over age, so a no-op save can't quietly drift the stored
  // birth date through an age-in-years round trip.
  useEffect(() => {
    if (animal && !initialized) {
      setType(animal.type)
      setName(animal.name)
      setTag(animal.tag || '')
      setBreedId(animal.breed_id || '')
      setSex(animal.sex || '')
      setKnowsDob(true)
      setDob(animal.date_of_birth || '')
      setDatePurchased(animal.date_of_purchase || '')
      setOrigin(animal.origin || '')
      setDamId(animal.dam_id || '')
      setSireId(animal.sire_id || '')
      setInitialized(true)
    }
  }, [animal, initialized])

  const { data: breeds = [] } = useQuery(['breeds', type], () => breedService.getAll(type))
  const others = animals.filter((a) => a.id !== Number(id))
  // Same eligibility predicate as AddAnimal: same species as the currently
  // selected type, correct sex, old enough, not archived, hasn't exited.
  const isEligibleParent = (a, requiredSex) =>
    a.type === type &&
    a.sex === requiredSex &&
    a.age != null &&
    a.min_age != null &&
    a.age >= a.min_age &&
    !a.is_archived &&
    !a.exit_reason
  const dams = others.filter((a) => isEligibleParent(a, 'female'))
  const sires = others.filter((a) => isEligibleParent(a, 'male'))

  const updateMutation = useMutation((payload) => animalService.update(id, payload), {
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries(['animal', id]),
        queryClient.invalidateQueries('animals'),
        queryClient.invalidateQueries('farm-details'),
        queryClient.invalidateQueries('farm-statistics'),
      ])
      toast.success(t('editAnimal.updatedToast', { name: data.name }))
      navigate(`/animals/${id}`)
    },
    onError: (error) => toast.error(apiErrorMessage(error, t('common.error'))),
  })

  const submit = () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error(t('addAnimal.nameRequired'))
      return
    }

    const parsedAge = parseFloat(age)
    if (knowsDob ? !dob : Number.isNaN(parsedAge) || parsedAge < 0) {
      toast.error(t('addAnimal.ageRequired'))
      return
    }

    updateMutation.mutate({
      type,
      name: trimmedName,
      tag: tag.trim() || undefined,
      breed_id: breedId || undefined,
      sex: sex || undefined,
      date_of_purchase: datePurchased || undefined,
      origin: origin || undefined,
      dam_id: damId || undefined,
      sire_id: sireId || undefined,
      ...(knowsDob ? { date_of_birth: dob } : { age: parsedAge }),
    })
  }

  if (isLoading || !initialized) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="large" message={t('common.loading')} />
      </div>
    )
  }

  if (!animal) {
    return (
      <div className="animate-hf-pop">
        <button onClick={() => navigate('/animals')} className={backBtnClass}>
          <span className="text-base rtl:rotate-180">←</span> {t('common.backToAnimals')}
        </button>
      </div>
    )
  }

  const locked = animal.breeding_locked

  return (
    <div className="mx-auto max-w-[680px] animate-hf-pop">
      <button onClick={() => navigate(`/animals/${id}`)} className={backBtnClass}>
        <span className="text-base rtl:rotate-180">←</span> {t('common.back')}
      </button>

      <div className="rounded-2xl bg-cream p-7 shadow-ribbon">
        <h1 className="mb-6 text-3xl">{t('editAnimal.title', { name: animal.name })}</h1>

        <label className={labelClass}>{t('addAnimal.animalType')}</label>
        <div className="mb-2 grid grid-cols-2 gap-3 xs:grid-cols-4">
          {TYPES.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => !locked && setType(opt)}
              disabled={locked}
              className={choiceClass(type === opt, locked)}
            >
              <span className="mb-1 inline-flex h-[50px] w-[50px] items-center justify-center">
                <AnimalIcon type={opt} size={50} />
              </span>
              <span className="block font-display text-[15px] font-bold text-brown-text">{t(`species.${opt}.label`)}</span>
            </button>
          ))}
        </div>
        {locked && <p className="mb-[22px] text-[12.5px] text-tan">{t('editAnimal.speciesLocked')}</p>}
        {!locked && <div className="mb-[22px]" />}

        <div className="grid grid-cols-1 gap-x-4 xs:grid-cols-2">
          <div className={fieldGroupClass}>
            <label htmlFor="an" className={labelClass}>{t('addAnimal.name')}</label>
            <HfInput id="an" type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className={fieldGroupClass}>
            <label htmlFor="at" className={labelClass}>{t('addAnimal.tag')}</label>
            <HfInput id="at" type="text" value={tag} onChange={(e) => setTag(e.target.value)} placeholder={t('addAnimal.tagPlaceholder')} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-4 xs:grid-cols-2">
          <div className={fieldGroupClass}>
            <label htmlFor="ab" className={labelClass}>{t('addAnimal.breed')}</label>
            <HfSelect id="ab" value={breedId} onChange={(e) => setBreedId(e.target.value)}>
              <option value="">{t('addAnimal.breedPlaceholder')}</option>
              {breeds.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </HfSelect>
          </div>
          <div className={fieldGroupClass}>
            <label htmlFor="as" className={labelClass}>{t('addAnimal.sex')}</label>
            <HfSelect id="as" value={sex} onChange={(e) => setSex(e.target.value)} disabled={locked}>
              <option value="">{t('addAnimal.selectOptional')}</option>
              <option value="female">{t('addAnimal.female')}</option>
              <option value="male">{t('addAnimal.male')}</option>
            </HfSelect>
            {locked && <p className="mt-1.5 text-[12.5px] text-tan">{t('editAnimal.sexLocked')}</p>}
          </div>
        </div>

        <div className={fieldGroupClass}>
          <label className={labelClass}>{t('addAnimal.birthMethod')}</label>
          <div className="mb-2.5 flex gap-2.5">
            <button type="button" onClick={() => setKnowsDob(true)} className={toggleOptionClass(knowsDob)}>
              {t('addAnimal.knowDob')}
            </button>
            <button type="button" onClick={() => setKnowsDob(false)} className={toggleOptionClass(!knowsDob)}>
              {t('addAnimal.onlyKnowAge')}
            </button>
          </div>
          {knowsDob ? (
            <HfInput
              type="date"
              value={dob}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDob(e.target.value)}
            />
          ) : (
            <HfInput type="number" min="0" step="0.1" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 1.5" />
          )}
        </div>

        <div className="grid grid-cols-1 gap-x-4 xs:grid-cols-2">
          <div className={fieldGroupClass}>
            <label htmlFor="ap" className={labelClass}>{t('addAnimal.dateOfPurchase')}</label>
            <HfInput
              id="ap"
              type="date"
              value={datePurchased}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setDatePurchased(e.target.value)}
              disabled={origin === 'born'}
              className={origin === 'born' ? 'cursor-not-allowed opacity-60' : ''}
            />
          </div>
          <div className={fieldGroupClass}>
            <label htmlFor="ao" className={labelClass}>{t('addAnimal.origin')}</label>
            <HfSelect
              id="ao"
              value={origin}
              onChange={(e) => {
                const value = e.target.value
                setOrigin(value)
                if (value === 'born') setDatePurchased('')
              }}
            >
              <option value="">{t('addAnimal.selectOptional')}</option>
              <option value="born">{t('addAnimal.born')}</option>
              <option value="purchased">{t('addAnimal.purchased')}</option>
            </HfSelect>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-4 xs:grid-cols-2">
          <div className={fieldGroupClass}>
            <label htmlFor="ad" className={labelClass}>{t('addAnimal.dam')}</label>
            <HfSelect id="ad" value={damId} onChange={(e) => setDamId(e.target.value)}>
              <option value="">{t('addAnimal.noneOption')}</option>
              {dams.map((a) => (
                <option key={a.id} value={a.id}>{a.name}{a.tag ? ` (${a.tag})` : ''}</option>
              ))}
            </HfSelect>
          </div>
          <div className={fieldGroupClass}>
            <label htmlFor="asi" className={labelClass}>{t('addAnimal.sire')}</label>
            <HfSelect id="asi" value={sireId} onChange={(e) => setSireId(e.target.value)}>
              <option value="">{t('addAnimal.noneOption')}</option>
              {sires.map((a) => (
                <option key={a.id} value={a.id}>{a.name}{a.tag ? ` (${a.tag})` : ''}</option>
              ))}
            </HfSelect>
          </div>
        </div>

        <button
          onClick={submit}
          disabled={updateMutation.isLoading}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-none bg-brown p-3.5 font-display text-base font-bold text-white shadow-soft transition-all duration-200 ease-pop enabled:hover:scale-[1.02] enabled:hover:bg-brown-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {updateMutation.isLoading ? t('editAnimal.submitting') : t('editAnimal.submit')}
        </button>
      </div>
    </div>
  )
}

export default EditAnimal
