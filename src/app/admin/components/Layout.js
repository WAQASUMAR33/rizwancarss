import React from 'react'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-400 to-indigo-600 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-blue-500 text-white">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Admin User Management</h1>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold">AirAdmin</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

