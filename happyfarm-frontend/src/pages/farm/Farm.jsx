import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { farmService } from '../../services/api/farm.js'
import { animalService } from '../../services/api/animals.js'
import { useAuth } from '../../context/AuthContext.jsx'
import Card from '../../components/common/UI/Card.jsx'
import Button from '../../components/common/UI/Button.jsx'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import { getAnimalTypeInfo } from '../../constants/animalTypes.js'
import { 
  Home,
  User,
  Calendar,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Plus,
  Heart,
  Scissors,
  RefreshCw
} from 'lucide-react'

const Farm = () => {
  const { user } = useAuth()

  // Fetch farm details
  const { data: farmDetails, isLoading: farmLoading, error: farmError, refetch: refetchFarm } = useQuery(
    'farm-details',
    farmService.getDetails,
    {
      refetchOnWindowFocus: true,
      refetchInterval: 30000 // Refresh every 30 seconds
    }
  )

  // Fetch animals for additional insights
  const { data: animals = [], isLoading: animalsLoading } = useQuery(
    'animals',
    animalService.getAll,
    {
      refetchOnWindowFocus: true
    }
  )

  if (farmLoading || animalsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Farm Details</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="large" message="Loading farm details..." />
        </div>
      </div>
    )
  }

  if (farmError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Farm Details</h1>
          <Button onClick={() => refetchFarm()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
        <Card>
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error Loading Farm Details
            </h3>
            <p className="text-gray-600 mb-6">
              Unable to load your farm information. Please try again.
            </p>
            <Button onClick={() => refetchFarm()}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (!farmDetails) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Farm Details</h1>
        <Card>
          <div className="text-center py-12">
            <Home className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Farm Found
            </h3>
            <p className="text-gray-600">
              You don't have a farm set up yet.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  const stats = farmDetails.statistics || {}
  const typeStats = stats.by_type || {}

  // Calculate some additional insights
  const totalValue = Object.values(typeStats).reduce((sum, count) => sum + count, 0)
  const needsCareCount = (stats.recently_fed || 0) + (stats.recently_groomed || 0)
  const farmAge = farmDetails.created_at ? Math.floor((new Date() - new Date(farmDetails.created_at)) / (1000 * 60 * 60 * 24)) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Farm Details</h1>
        <div className="flex space-x-3">
          <Link to="/animals/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Animal
            </Button>
          </Link>
          <Button onClick={() => refetchFarm()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Farm Information Card */}
      <Card title="Farm Information">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Home className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Farm Name</p>
              <p className="text-lg font-semibold text-gray-900">{farmDetails.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <User className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Owner</p>
              <p className="text-lg font-semibold text-gray-900">{farmDetails.owner?.name}</p>
              <p className="text-sm text-gray-500">{farmDetails.owner?.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Farm Age</p>
              <p className="text-lg font-semibold text-gray-900">
                {farmAge} {farmAge === 1 ? 'day' : 'days'}
              </p>
              <p className="text-sm text-gray-500">
                Since {new Date(farmDetails.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Farm Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Animals</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_animals || 0}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active Animals</p>
              <p className="text-2xl font-bold text-green-600">
                {(stats.total_animals || 0) - (stats.sacrificed_animals || 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Heart className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Well Cared</p>
              <p className="text-2xl font-bold text-yellow-600">{needsCareCount}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Scissors className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Sacrificed</p>
              <p className="text-2xl font-bold text-red-600">{stats.sacrificed_animals || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Animals by Type */}
      <Card title="Animals by Type">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(typeStats).map(([type, count]) => {
            const typeInfo = getAnimalTypeInfo(type)
            return (
              <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl mb-2">{typeInfo?.icon}</div>
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600">{typeInfo?.label}</div>
              </div>
            )
          })}
        </div>
        {totalValue === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No animals in your farm yet.</p>
            <Link to="/animals/add" className="inline-block mt-2">
              <Button size="small">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Animal
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {/* Care Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Recent Care Activities">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Recently Fed (24h)</span>
              <span className="text-lg font-semibold text-green-600">{stats.recently_fed || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Recently Groomed (24h)</span>
              <span className="text-lg font-semibold text-blue-600">{stats.recently_groomed || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Eligible for Sacrifice</span>
              <span className="text-lg font-semibold text-purple-600">{stats.eligible_for_sacrifice || 0}</span>
            </div>
          </div>
        </Card>

        <Card title="Quick Actions">
          <div className="space-y-3">
            <Link to="/animals" className="block">
              <Button variant="outline" className="w-full justify-start">
                <BarChart3 className="h-4 w-4 mr-2" />
                View All Animals
              </Button>
            </Link>
            <Link to="/animals/add" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Add New Animal
              </Button>
            </Link>
            <Link to="/" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Animals Summary */}
      {animals.length > 0 && (
        <Card title="Recent Animals" subtitle={`Showing ${Math.min(animals.length, 3)} of ${animals.length} animals`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {animals.slice(0, 3).map(animal => {
              const typeInfo = getAnimalTypeInfo(animal.type)
              return (
                <Link key={animal.id} to={`/animals/${animal.id}`}>
                  <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{typeInfo?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{animal.name}</p>
                        <p className="text-sm text-gray-600">
                          {typeInfo?.label} • {animal.age} years
                        </p>
                        <div className="mt-1">
                          {animal.is_sacrificed ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              Sacrificed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
          {animals.length > 3 && (
            <div className="mt-4 text-center">
              <Link to="/animals">
                <Button variant="outline">
                  View All {animals.length} Animals
                </Button>
              </Link>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default Farm 