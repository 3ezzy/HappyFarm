import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { useAuth } from '../../context/AuthContext.jsx'
import { farmService } from '../../services/api/farm.js'
import { animalService } from '../../services/api/animals.js'
import { useNotification } from '../../context/NotificationContext.jsx'
import Card from '../../components/common/UI/Card.jsx'
import Button from '../../components/common/UI/Button.jsx'
import LoadingSpinner from '../../components/common/UI/LoadingSpinner.jsx'
import Modal from '../../components/common/UI/Modal.jsx'
import { 
  User,
  Home,
  Calendar,
  BarChart3,
  Mail,
  Settings,
  LogOut,
  Shield,
  Clock,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Edit
} from 'lucide-react'

const Profile = () => {
  const { user, farm, logout } = useAuth()
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // Fetch farm statistics for profile insights
  const { data: farmStats, isLoading: statsLoading } = useQuery(
    'farm-statistics',
    farmService.getStatistics,
    {
      refetchOnWindowFocus: true
    }
  )

  // Fetch animals for activity insights
  const { data: animals = [], isLoading: animalsLoading } = useQuery(
    'animals',
    animalService.getAll,
    {
      refetchOnWindowFocus: true
    }
  )

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      showNotification('Error logging out. Please try again.', 'error')
    }
    setShowLogoutModal(false)
  }

  if (!user || !farm) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <Card>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="large" message="Loading profile..." />
          </div>
        </Card>
      </div>
    )
  }

  // Calculate some profile statistics
  const joinDate = farm.created_at ? new Date(farm.created_at) : new Date()
  const daysSinceJoin = Math.floor((new Date() - joinDate) / (1000 * 60 * 60 * 24))
  const stats = farmStats || {}
  const activeAnimals = (stats.total_animals || 0) - (stats.sacrifice_status?.already_sacrificed || 0)
  const recentActivity = animals.filter(animal => {
    const recent = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
    return (animal.fed_at && new Date(animal.fed_at) > recent) ||
           (animal.groomed_at && new Date(animal.groomed_at) > recent)
  }).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <Button variant="outline">
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Information Card */}
        <div className="lg:col-span-2">
          <Card title="Account Information">
            <div className="flex items-center space-x-6 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.name}</h2>
                <p className="text-gray-600 mb-2 flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  {user.email}
                </p>
                <p className="text-sm text-gray-500 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Member since {joinDate.toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Account Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {daysSinceJoin}
                </div>
                <div className="text-sm text-gray-600">Days Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.total_animals || 0}
                </div>
                <div className="text-sm text-gray-600">Total Animals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {recentActivity}
                </div>
                <div className="text-sm text-gray-600">Recent Actions</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions Card */}
        <div>
          <Card title="Quick Actions">
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/farm')}
              >
                <Home className="h-4 w-4 mr-2" />
                View Farm Details
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/animals')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Manage Animals
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/')}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                View Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Farm Information */}
      <Card title="Farm Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Home className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Farm Name</p>
              <p className="text-lg font-semibold text-gray-900">{farm.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Animals</p>
              <p className="text-lg font-semibold text-gray-900">{activeAnimals}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Farm Created</p>
              <p className="text-lg font-semibold text-gray-900">
                {joinDate.toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Recent Activity</p>
              <p className="text-lg font-semibold text-gray-900">{recentActivity} actions today</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Activity Summary */}
      {!statsLoading && stats && (
        <Card title="Farm Activity Summary">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.animals_by_type?.sheep || 0}
              </div>
              <div className="text-sm text-blue-800">🐑 Sheep</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.animals_by_type?.goat || 0}
              </div>
              <div className="text-sm text-green-800">🐐 Goats</div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.animals_by_type?.cow || 0}
              </div>
              <div className="text-sm text-red-800">🐄 Cows</div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.animals_by_type?.camel || 0}
              </div>
              <div className="text-sm text-yellow-800">🐪 Camels</div>
            </div>
          </div>

          {stats.sacrifice_status && (
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {stats.sacrifice_status.not_yet_eligible || 0}
                </div>
                <div className="text-sm text-gray-600">Growing</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {stats.sacrifice_status.eligible_for_sacrifice || 0}
                </div>
                <div className="text-sm text-gray-600">Ready</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-600">
                  {stats.sacrifice_status.already_sacrificed || 0}
                </div>
                <div className="text-sm text-gray-600">Sacrificed</div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Settings Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Account Settings */}
        <Card title="Account Settings">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Profile Information</p>
                  <p className="text-sm text-gray-600">Update your name and email</p>
                </div>
              </div>
              <Button variant="outline" size="small">
                <Edit className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <Shield className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Password</p>
                  <p className="text-sm text-gray-600">Change your password</p>
                </div>
              </div>
              <Button variant="outline" size="small">
                <Edit className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <Settings className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Preferences</p>
                  <p className="text-sm text-gray-600">Notifications and language</p>
                </div>
              </div>
              <Button variant="outline" size="small">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Security & Privacy */}
        <Card title="Security & Privacy">
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-5 w-5 text-green-600" />
                <p className="font-medium text-green-900">Account Secure</p>
              </div>
              <p className="text-sm text-green-800">
                Your account is protected and all data is encrypted.
              </p>
            </div>

            <div className="pt-4 border-t">
              <Button 
                onClick={() => setShowLogoutModal(true)}
                variant="outline"
                className="w-full justify-center text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Sign Out"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Sign out of your account?
              </h3>
              <p className="text-sm text-gray-600">
                You'll need to sign in again to access your farm.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowLogoutModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Profile 