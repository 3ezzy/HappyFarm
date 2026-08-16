import { useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import toast from 'react-hot-toast'
import { animalService } from '../../services/api/animals.js'
import { breedService } from '../../services/api/breeds.js'
import { useAuth } from '../../context/AuthContext.jsx'
import AnimalIcon from '../../components/common/AnimalIcon.jsx'
import { HfInput, HfSelect, TYPES } from '../../theme/hf.jsx'

const backBtnClass =
  'mb-5 inline-flex cursor-pointer items-center gap-1.5 rounded-full border-2 border-line bg-cream ' +
  'px-[18px] py-2 font-display text-sm font-bold text-brown-text ' +
  'transition-transform duration-200 ease-pop hover:scale-[1.04]'

const choiceClass = (active) =>
  classNames(
    'flex cursor-pointer flex-col items-center rounded-2xl border-2 px-2 py-3.5 transition-all duration-200 ease-pop',
    active ? 'border-green bg-green-soft shadow-ribbon' : 'border-transparent bg-sand'
  )

const toggleOptionClass = (active) =>
  classNames(
    'flex-1 cursor-pointer rounded-full border-2 px-3 py-2 text-center font-sans text-[13.5px] font-semibold transition-all duration-200',
    active ? 'border-green bg-green text-white' : 'border-line bg-cream text-brown'
  )

const labelClass = 'mb-2 block text-sm font-semibold text-brown-text'
const fieldGroupClass = 'mb-[18px]'

const AddAnimal = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { farm } = useAuth()

  const [type, setType] = useState('sheep')
  const [name, setName] = useState('')
  const [tag, setTag] = useState('')
  const [breedId, setBreedId] = useState('')
  const [sex, setSex] = useState('')
  const [knowsDob, setKnowsDob] = useState(false)
  const [dob, setDob] = useState('')
  const [age, setAge] = useState('')
  const [datePurchased, setDatePurchased] = useState('')
  const [origin, setOrigin] = useState('')
  const [damId, setDamId] = useState('')
  const [sireId, setSireId] = useState('')

  const { data: breeds = [] } = useQuery(['breeds', type], () => breedService.getAll(type))
  const { data: animals = [] } = useQuery('animals', () => animalService.getAll())
  const dams = animals.filter((a) => a.sex !== 'male')
  const sires = animals.filter((a) => a.sex !== 'female')

  const createMutation = useMutation(animalService.create, {
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries('animals'),
        queryClient.invalidateQueries('farm-details'),
        queryClient.invalidateQueries('farm-statistics'),
      ])
      toast.success(t('addAnimal.createdToast', { name: data.name }))
      navigate('/animals')
    },
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

    createMutation.mutate({
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

  return (
    <div className="mx-auto max-w-[680px] animate-hf-pop">
      <button onClick={() => navigate('/animals')} className={backBtnClass}>
        <span className="text-base rtl:rotate-180">←</span> {t('common.back')}
      </button>

      <div className="rounded-2xl bg-cream p-7 shadow-ribbon">
        <h1 className="mb-1.5 text-3xl">{t('addAnimal.title')}</h1>
        <p className="mb-6 text-tan">{t('addAnimal.welcomeSub', { farm: farm?.name })}</p>

        <label className={labelClass}>{t('addAnimal.animalType')}</label>
        <div className="mb-[22px] grid grid-cols-2 gap-3 xs:grid-cols-4">
          {TYPES.map((opt) => (
            <button key={opt} onClick={() => setType(opt)} className={choiceClass(type === opt)}>
              <span className="mb-1 inline-flex h-[50px] w-[50px] items-center justify-center">
                <AnimalIcon type={opt} size={50} />
              </span>
              <span className="block font-display text-[15px] font-bold text-brown-text">{t(`species.${opt}.label`)}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-x-4 xs:grid-cols-2">
          <div className={fieldGroupClass}>
            <label htmlFor="an" className={labelClass}>{t('addAnimal.name')}</label>
            <HfInput id="an" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Whitey" />
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
            <HfSelect id="as" value={sex} onChange={(e) => setSex(e.target.value)}>
              <option value="">{t('addAnimal.selectOptional')}</option>
              <option value="female">{t('addAnimal.female')}</option>
              <option value="male">{t('addAnimal.male')}</option>
            </HfSelect>
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
            />
          </div>
          <div className={fieldGroupClass}>
            <label htmlFor="ao" className={labelClass}>{t('addAnimal.origin')}</label>
            <HfSelect id="ao" value={origin} onChange={(e) => setOrigin(e.target.value)}>
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

        <div className="mb-6 rounded-2xl border-[3px] border-yellow-line bg-yellow-badgeBg px-4 py-3">
          <p className="text-[13.5px] text-yellow-deep">
            {t('addAnimal.eligibilityHint', { plural: t(`species.${type}.plural`), minAge: t(`minAge.${type}`) })}
          </p>
        </div>

        <button
          onClick={submit}
          disabled={createMutation.isLoading}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border-none bg-brown p-3.5 font-display text-base font-bold text-white shadow-soft transition-all duration-200 ease-pop enabled:hover:scale-[1.02] enabled:hover:bg-brown-dark disabled:cursor-not-allowed disabled:opacity-70"
        >
          {createMutation.isLoading ? t('addAnimal.submitting') : t('addAnimal.submit')} <span className="text-lg rtl:rotate-180">→</span>
        </button>
      </div>
    </div>
  )
}

export default AddAnimal
