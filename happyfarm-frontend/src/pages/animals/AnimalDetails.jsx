import React, { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { animalService } from '../../services/api/animals.js'
import { getAnimalTypeInfo } from '../../constants/animalTypes.js'
import { useNotification } from '../../context/NotificationContext.jsx'
import Card from '../../components/common/UI/Card.jsx'
import Button from '../../components/common/UI/Button.jsx'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import Modal from '../../components/common/UI/Modal.jsx'
import { 
  ArrowLeft,
  Heart,
  Scissors,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Home
} from 'lucide-react'

const AnimalDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showNotification } = useNotification()
  
  const [showSacrificeModal, setShowSacrificeModal] = useState(false)

  // Fetch animal details
  const { data: animal, isLoading, error, refetch } = useQuery(
    ['animal', id],
    () => animalService.getById(id),
    {
      refetchOnWindowFocus: true,
      refetchInterval: 30000
    }
  )

  // Feed animal mutation
  const feedMutation = useMutation(
    () => animalService.feed(id),
    {
      onSuccess: async () => {
        showNotification(`${animal.name} has been fed!`, 'success')
        
        // Invalidate all related queries
        await Promise.all([
          queryClient.invalidateQueries(['animal', id]),
          queryClient.invalidateQueries('animals'),
          queryClient.invalidateQueries('farm-details'),
          queryClient.invalidateQueries('farm-statistics')
        ])
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Failed to feed animal'
        showNotification(message, 'error')
      }
    }
  )

  // Groom animal mutation
  const groomMutation = useMutation(
    () => animalService.groom(id),
    {
      onSuccess: async () => {
        showNotification(`${animal.name} has been groomed!`, 'success')
        
        // Invalidate all related queries
        await Promise.all([
          queryClient.invalidateQueries(['animal', id]),
          queryClient.invalidateQueries('animals'),
          queryClient.invalidateQueries('farm-details'),
          queryClient.invalidateQueries('farm-statistics')
        ])
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Failed to groom animal'
        showNotification(message, 'error')
      }
    }
  )

  // Sacrifice animal mutation
  const sacrificeMutation = useMutation(
    () => animalService.sacrifice(id),
    {
      onSuccess: async () => {
        showNotification(`${animal.name} has been sacrificed. May it be accepted.`, 'success')
        
        // Invalidate all related queries
        await Promise.all([
          queryClient.invalidateQueries(['animal', id]),
          queryClient.invalidateQueries('animals'),
          queryClient.invalidateQueries('farm-details'),
          queryClient.invalidateQueries('farm-statistics')
        ])
        
        setShowSacrificeModal(false)
      },
      onError: (error) => {
        const message = error.response?.data?.error || 'Failed to sacrifice animal'
        showNotification(message, 'error')
        setShowSacrificeModal(false)
      }
    }
  )

  const handleSacrifice = () => {
    sacrificeMutation.mutate()
  }

  // Helper functions
  const formatDateTime = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  const getTimeSince = (dateString) => {
    if (!dateString) return null
    const now = new Date()
    const past = new Date(dateString)
    const diffMs = now - past
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  const isEligibleForSacrifice = (animal) => {
    if (!animal || animal.is_sacrificed) return false
    
    const minAges = {
      'sheep': 0.5,  // 6 months
      'goat': 1,     // 1 year
      'cow': 2,      // 2 years
      'camel': 5,    // 5 years
    }
    
    return animal.age >= (minAges[animal.type] || 0)
  }

  const getSacrificeEligibilityMessage = (animal) => {
    if (!animal) return ''
    
    const minAges = {
      'sheep': { age: 0.5, text: '6 months' },
      'goat': { age: 1, text: '1 year' },
      'cow': { age: 2, text: '2 years' },
      'camel': { age: 5, text: '5 years' },
    }
    
    const requirement = minAges[animal.type]
    if (!requirement) return ''
    
    if (animal.age >= requirement.age) {
      return `✅ Eligible for sacrifice (minimum ${requirement.text})`
    } else {
      const remaining = requirement.age - animal.age
      return `❌ Not yet eligible. Needs ${remaining.toFixed(1)} more years (minimum ${requirement.text})`
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link to="/animals">
            <Button variant="outline" size="small">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Animals
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Animal Details</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="large" message="Loading animal details..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link to="/animals">
            <Button variant="outline" size="small">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Animals
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Animal Details</h1>
        </div>
        <Card>
          <div className="text-center py-12">
            <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Animal Not Found
            </h3>
            <p className="text-gray-600 mb-6">
              This animal doesn't exist or you don't have permission to view it.
            </p>
            <Link to="/animals">
              <Button>
                <Home className="h-4 w-4 mr-2" />
                Back to Animals
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (!animal) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link to="/animals">
            <Button variant="outline" size="small">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Animals
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Animal Details</h1>
        </div>
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-600">Animal not found.</p>
          </div>
        </Card>
      </div>
    )
  }

  const typeInfo = getAnimalTypeInfo(animal.type)
  const eligible = isEligibleForSacrifice(animal)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/animals">
            <Button variant="outline" size="small">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Animals
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Animal Details</h1>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Animal Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2">
          <Card title="Animal Information">
            <div className="flex items-center space-x-6 mb-6">
              <div className="text-6xl">
                {typeInfo?.icon}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{animal.name}</h2>
                <p className="text-xl text-gray-600 mb-1">
                  {typeInfo?.label} • {animal.age} years old
                </p>
                <p className="text-sm text-gray-500">{typeInfo?.labelAr}</p>
                <div className="mt-3">
                  {animal.is_sacrificed ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      <Scissors className="h-4 w-4 mr-1" />
                      Sacrificed
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Active
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Care History */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-900">Last Fed</h4>
                  <Heart className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-sm text-blue-800">
                  {formatDateTime(animal.fed_at)}
                </p>
                {animal.fed_at && (
                  <p className="text-xs text-blue-600 mt-1">
                    {getTimeSince(animal.fed_at)}
                  </p>
                )}
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-green-900">Last Groomed</h4>
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-sm text-green-800">
                  {formatDateTime(animal.groomed_at)}
                </p>
                {animal.groomed_at && (
                  <p className="text-xs text-green-600 mt-1">
                    {getTimeSince(animal.groomed_at)}
                  </p>
                )}
              </div>
            </div>

            {/* Sacrifice Status */}
            {animal.is_sacrificed ? (
              <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Sacrificed</h4>
                  <Scissors className="h-5 w-5 text-gray-600" />
                </div>
                <p className="text-sm text-gray-800">
                  {formatDateTime(animal.sacrificed_at)}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  May it be accepted (تقبل الله)
                </p>
              </div>
            ) : (
              <div className="mt-4 bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-purple-900">Sacrifice Eligibility</h4>
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <p className="text-sm text-purple-800">
                  {getSacrificeEligibilityMessage(animal)}
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Actions Card */}
        <div>
          <Card title="Animal Care">
            {animal.is_sacrificed ? (
              <div className="text-center py-8">
                <Scissors className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 mb-2">This animal has been sacrificed</p>
                <p className="text-sm text-gray-500">No further actions available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Feed Button */}
                <Button
                  type="button"
                  onClick={() => feedMutation.mutate()}
                  disabled={feedMutation.isLoading}
                  className="w-full justify-start"
                  variant="outline"
                >
                  {feedMutation.isLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      Feeding...
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4 mr-2 text-blue-600" />
                      Feed {animal.name}
                    </>
                  )}
                </Button>

                {/* Groom Button */}
                <Button
                  type="button"
                  onClick={() => groomMutation.mutate()}
                  disabled={groomMutation.isLoading}
                  className="w-full justify-start"
                  variant="outline"
                >
                  {groomMutation.isLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-green-600 border-t-transparent rounded-full"></div>
                      Grooming...
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 mr-2 text-green-600" />
                      Groom {animal.name}
                    </>
                  )}
                </Button>

                {/* Sacrifice Button */}
                <div className="pt-2 border-t">
                  <Button
                    type="button"
                    onClick={() => setShowSacrificeModal(true)}
                    disabled={!eligible}
                    className="w-full justify-start"
                    variant={eligible ? "outline" : "outline"}
                  >
                    <Scissors className={`h-4 w-4 mr-2 ${eligible ? 'text-red-600' : 'text-gray-400'}`} />
                    {eligible ? `Sacrifice ${animal.name}` : 'Not Eligible for Sacrifice'}
                  </Button>
                  {!eligible && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Animal must meet minimum age requirements
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Sacrifice Confirmation Modal */}
      <Modal
        isOpen={showSacrificeModal}
        onClose={() => setShowSacrificeModal(false)}
        title="Confirm Sacrifice"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Sacrifice {animal?.name}?
              </h3>
              <p className="text-sm text-gray-600">
                This action cannot be undone.
              </p>
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-800">
              Are you sure you want to sacrifice <strong>{animal?.name}</strong>? 
              This will mark the animal as sacrificed and no further care actions will be available.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowSacrificeModal(false)}
              disabled={sacrificeMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSacrifice}
              disabled={sacrificeMutation.isLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {sacrificeMutation.isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                  Sacrificing...
                </>
              ) : (
                <>
                  <Scissors className="h-4 w-4 mr-2" />
                  Confirm Sacrifice
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AnimalDetails 