import React from 'react';
import { FaBell, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';

const Header = () => {
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Redirect is handled by the AuthContext/ProtectedRoute
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <header className="bg-white shadow h-16 fixed w-full top-0 left-0 ml-64 pr-64 z-10">
      <div className="flex justify-between items-center h-full px-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Train Ticket Admin Dashboard</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="text-gray-500 hover:text-gray-700 focus:outline-none relative">
            <FaBell className="text-xl" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              3
            </span>
          </button>
          
          <div className="relative group">
            <button className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 focus:outline-none">
              <FaUser className="text-xl" />
              <span className="font-medium">Admin</span>
            </button>
            
            <div className="absolute right-0 w-48 py-2 mt-2 bg-white rounded-md shadow-lg hidden group-hover:block">
              <a 
                href="#profile" 
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Profile
              </a>
              <button 
                onClick={handleSignOut} 
                className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <FaSignOutAlt className="mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
