import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { farmService } from '../../services/api/farm.js'
import { animalService } from '../../services/api/animals.js'
import { useAuth } from '../../context/AuthContext.jsx'
import Card from '../../components/common/UI/Card.jsx'
import Button from '../../components/common/UI/Button.jsx'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import { 
  Beef, 
  Plus, 
  BarChart3, 
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react'
import { getAnimalTypeInfo } from '../../constants/animalTypes.js'

const Dashboard = () => {
  const { user, farm } = useAuth()

  // Fetch farm statistics
  const { data: farmStats, isLoading: farmLoading, error: farmError } = useQuery(
    'farm-statistics',
    farmService.getStatistics,
    {
      refetchOnWindowFocus: true,
      refetchInterval: 30000 // Refresh every 30 seconds
    }
  )

  // Fetch animals for recent activity
  const { data: animals = [], isLoading: animalsLoading } = useQuery(
    'animals',
    animalService.getAll,
    {
      refetchOnWindowFocus: true
    }
  )

  if (farmLoading || animalsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="large" message="Loading dashboard..." />
      </div>
    )
  }

  if (farmError) {
    return (
      <Card className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error Loading Dashboard
        </h3>
        <p className="text-gray-600">
          Unable to load farm statistics. Please try again later.
        </p>
      </Card>
    )
  }

  const stats = farmStats || {}
  const recentAnimals = animals.slice(0, 5) // Show last 5 animals

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening at {farm?.name} today
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center">
          <div className="text-3xl font-bold text-primary-600">
            {stats.total_animals || 0}
          </div>
          <p className="text-gray-600 mt-1">Total Animals</p>
                        <div className="text-4xl mx-auto mt-2">🐑</div>
        </Card>

        <Card className="text-center">
          <div className="text-3xl font-bold text-green-600">
            {stats.sacrifice_status?.eligible_for_sacrifice || 0}
          </div>
          <p className="text-gray-600 mt-1">Ready for Sacrifice</p>
          <BarChart3 className="h-8 w-8 text-green-500 mx-auto mt-2" />
        </Card>

        <Card className="text-center">
          <div className="text-3xl font-bold text-blue-600">
            {stats.sacrifice_status?.already_sacrificed || 0}
          </div>
          <p className="text-gray-600 mt-1">Already Sacrificed</p>
          <Calendar className="h-8 w-8 text-blue-500 mx-auto mt-2" />
        </Card>

        <Card className="text-center">
          <div className="text-3xl font-bold text-orange-600">
            {stats.sacrifice_status?.not_yet_eligible || 0}
          </div>
          <p className="text-gray-600 mt-1">Not Yet Eligible</p>
          <TrendingUp className="h-8 w-8 text-orange-500 mx-auto mt-2" />
        </Card>
      </div>

      {/* Animals by Type */}
      {stats.animals_by_type && (
        <Card title="Animals by Type">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.animals_by_type).map(([type, count]) => {
              const typeInfo = getAnimalTypeInfo(type)
              return (
                <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">{typeInfo?.icon}</div>
                  <div className="text-xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-600">{typeInfo?.label}</div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/animals/add">
            <Button variant="primary" className="w-full h-16 text-base">
              <Plus className="h-5 w-5 mr-2" />
              Add New Animal
            </Button>
          </Link>
          
          <Link to="/animals">
            <Button variant="outline" className="w-full h-16 text-base">
                              <Beef className="h-5 w-5 mr-2" />
              View All Animals
            </Button>
          </Link>
          
          <Link to="/farm">
            <Button variant="secondary" className="w-full h-16 text-base">
              <BarChart3 className="h-5 w-5 mr-2" />
              Farm Statistics
            </Button>
          </Link>
        </div>
      </Card>

      {/* Recent Animals */}
      {recentAnimals.length > 0 && (
        <Card title="Recent Animals" subtitle="Your latest animals added to the farm">
          <div className="space-y-3">
            {recentAnimals.map(animal => {
              const typeInfo = getAnimalTypeInfo(animal.type)
              return (
                <Link
                  key={animal.id}
                  to={`/animals/${animal.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{typeInfo?.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900">{animal.name}</p>
                      <p className="text-sm text-gray-600">
                        {typeInfo?.label} • {animal.age} years old
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {animal.is_sacrificed ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Sacrificed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
          
          {animals.length > 5 && (
            <div className="mt-4 text-center">
              <Link to="/animals">
                <Button variant="outline" size="small">
                  View All {animals.length} Animals
                </Button>
              </Link>
            </div>
          )}
        </Card>
      )}

      {/* Empty State */}
      {animals.length === 0 && (
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">🐑</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No animals yet
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by adding your first animal to the farm.
          </p>
          <Link to="/animals/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add First Animal
            </Button>
          </Link>
        </Card>
      )}

      {/* Getting Started */}
      <Card title="Getting Started">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🏡</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Welcome to HappyFarm!
          </h3>
          <p className="text-gray-600 mb-6">
            Start by adding your first animal to begin managing your farm.
          </p>
          <Link to="/animals/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add First Animal
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default Dashboard 