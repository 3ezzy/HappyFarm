import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'react-query'
import { animalService } from '../../services/api/animals.js'
import Card from '../../components/common/UI/Card.jsx'
import Button from '../../components/common/UI/Button.jsx'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import { Plus, Beef, AlertCircle } from 'lucide-react'
import { getAnimalTypeInfo } from '../../constants/animalTypes.js'

const Animals = () => {
  const { data: animals = [], isLoading, error, refetch } = useQuery(
    'animals',
    animalService.getAll,
    {
      refetchOnWindowFocus: true,
      refetchInterval: 30000 // Refresh every 30 seconds
    }
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Animals</h1>
          <Link to="/animals/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Animal
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="large" message="Loading animals..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Animals</h1>
          <Link to="/animals/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Animal
            </Button>
          </Link>
        </div>
        <Card>
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error Loading Animals
            </h3>
            <p className="text-gray-600 mb-6">
              Unable to load your animals. Please try again.
            </p>
            <Button onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (animals.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Animals</h1>
          <Link to="/animals/add">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Animal
            </Button>
          </Link>
        </div>

        <Card>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🐑</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No animals yet
            </h3>
            <p className="text-gray-600 mb-6">
              Add your first animal to start managing your farm.
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Animals</h1>
        <Link to="/animals/add">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Animal
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {animals.map(animal => {
          const typeInfo = getAnimalTypeInfo(animal.type)
          return (
            <Link key={animal.id} to={`/animals/${animal.id}`}>
              <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="text-3xl">
                    {typeInfo?.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {animal.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {typeInfo?.label} • {animal.age} years old
                    </p>
                    <div className="flex items-center justify-between mt-2">
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
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Summary Card */}
      <Card title="Farm Summary">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {animals.length}
            </div>
            <div className="text-sm text-gray-600">Total Animals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {animals.filter(a => !a.is_sacrificed).length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {animals.filter(a => a.is_sacrificed).length}
            </div>
            <div className="text-sm text-gray-600">Sacrificed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {new Set(animals.map(a => a.type)).size}
            </div>
            <div className="text-sm text-gray-600">Animal Types</div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Animals 