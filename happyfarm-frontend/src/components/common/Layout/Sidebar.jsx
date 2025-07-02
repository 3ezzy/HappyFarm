import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Beef, 
  Plus, 
  Warehouse, 
  User, 
  HelpCircle,
  X 
} from 'lucide-react'
import classNames from 'classnames'

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Home,
      current: location.pathname === '/'
    },
    {
      name: 'Animals',
      href: '/animals',
      icon: Beef,
      current: location.pathname.startsWith('/animals')
    },
    {
      name: 'Add Animal',
      href: '/animals/add',
      icon: Plus,
      current: location.pathname === '/animals/add'
    },
    {
      name: 'Farm Details',
      href: '/farm',
      icon: Warehouse,
      current: location.pathname === '/farm'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      current: location.pathname === '/profile'
    }
  ]

  const sidebarClasses = classNames(
    'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:z-auto',
    {
      'translate-x-0': isOpen,
      '-translate-x-full': !isOpen
    }
  )

  return (
    <div className={sidebarClasses}>
      <div className="flex flex-col h-full">
        {/* Mobile header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
          <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => onClose()}
                className={classNames(
                  'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                  {
                    'bg-primary-100 text-primary-700 border-r-2 border-primary-600': item.current,
                    'text-gray-700 hover:bg-gray-100 hover:text-gray-900': !item.current
                  }
                )}
              >
                <Icon className={classNames(
                  'h-5 w-5',
                  {
                    'text-primary-600': item.current,
                    'text-gray-500': !item.current
                  }
                )} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <Link
            to="/help"
            onClick={() => onClose()}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
          >
            <HelpCircle className="h-5 w-5 text-gray-500" />
            <span>Help & Support</span>
          </Link>
          
          <div className="mt-4 px-3 py-2 bg-primary-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🐑</span>
              <div>
                <p className="text-xs text-primary-700 font-medium">
                  HappyFarm v1.0
                </p>
                <p className="text-xs text-primary-600">
                  Eid Al Adha Farm
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar 