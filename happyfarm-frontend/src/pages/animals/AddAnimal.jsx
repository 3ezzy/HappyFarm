import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from 'react-query'
import { animalService } from '../../services/api/animals.js'
import { ANIMAL_TYPE_OPTIONS } from '../../constants/animalTypes.js'
import Card from '../../components/common/UI/Card.jsx'
import Button from '../../components/common/UI/Button.jsx'
import Input from '../../components/common/UI/Input.jsx'
import { useNotification } from '../../context/NotificationContext.jsx'
import { ArrowLeft, Save } from 'lucide-react'

const AddAnimal = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showNotification } = useNotification()
  
  const [formData, setFormData] = useState({
    type: '',
    name: '',
    age: ''
  })
  
  const [errors, setErrors] = useState({})

  // Create animal mutation
  const createAnimalMutation = useMutation(
    animalService.create,
    {
      onSuccess: async (data) => {
        showNotification(`${data.name} has been added to your farm!`, 'success')
        
        // Invalidate all related queries to ensure data consistency
        await Promise.all([
          queryClient.invalidateQueries('animals'),
          queryClient.invalidateQueries('farm-details'), 
          queryClient.invalidateQueries('farm-statistics')
        ])
        
        // Small delay to ensure cache updates complete
        setTimeout(() => {
          navigate('/animals')
        }, 100)
      },
      onError: (error) => {
        console.error('Error creating animal:', error)
        const errorMessage = error.response?.data?.message || 'Failed to add animal. Please try again.'
        showNotification(errorMessage, 'error')
        
        // Handle validation errors from backend
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors)
        }
      }
    }
  )

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.type) {
      newErrors.type = 'Please select an animal type'
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Animal name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Animal name must be at least 2 characters'
    }
    
    if (!formData.age) {
      newErrors.age = 'Age is required'
    } else {
      const age = parseFloat(formData.age)
      if (isNaN(age) || age < 0) {
        newErrors.age = 'Please enter a valid age'
      } else if (age > 50) {
        newErrors.age = 'Age seems too high. Please check the value.'
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    const animalData = {
      type: formData.type,
      name: formData.name.trim(),
      age: parseFloat(formData.age)
    }
    
    createAnimalMutation.mutate(animalData)
  }

  const selectedAnimalType = ANIMAL_TYPE_OPTIONS.find(option => option.value === formData.type)

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/animals">
          <Button variant="outline" size="small">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Animals
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Animal</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Animal Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Animal Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {ANIMAL_TYPE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`
                      relative flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors
                      ${formData.type === option.value 
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                        : 'border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={option.value}
                      checked={formData.type === option.value}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{option.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.labelAr}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.type && (
                <p className="mt-2 text-sm text-red-600">{errors.type}</p>
              )}
            </div>

            {/* Animal Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Animal Name *
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter a name for your animal"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Animal Age */}
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
                Age (in years) *
              </label>
              <Input
                id="age"
                name="age"
                type="number"
                step="0.25"
                min="0"
                max="50"
                value={formData.age}
                onChange={handleInputChange}
                placeholder="e.g., 1.5 for 1 year and 6 months"
                className={errors.age ? 'border-red-500' : ''}
              />
              {errors.age && (
                <p className="mt-2 text-sm text-red-600">{errors.age}</p>
              )}
              <p className="mt-1 text-sm text-gray-600">
                You can use decimals (e.g., 0.5 for 6 months, 1.25 for 1 year and 3 months)
              </p>
            </div>

            {/* Preview */}
            {selectedAnimalType && formData.name && formData.age && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Preview:</h4>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{selectedAnimalType.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900">{formData.name}</p>
                    <p className="text-sm text-gray-600">
                      {selectedAnimalType.label} • {formData.age} years old
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4">
              <Link to="/animals">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={createAnimalMutation.isLoading}
                className="min-w-[120px]"
              >
                {createAnimalMutation.isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Add Animal
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default AddAnimal 