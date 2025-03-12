import React from 'react';
import { FiUnlock } from 'react-icons/fi';
const RoleCard = ({ title, icon: Icon, onClick, description }) => {
  return (
    <div
      className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer w-[400px] flex flex-col items-center space-y-6 transform hover:-translate-y-1"
    >
      <div className="bg-primary/10 p-4 rounded-full">
        <Icon className="w-12 h-12 text-primary" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-primary">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
      <div className='mt-4 flex gap-4'>
      <button
        onClick={onClick}
        className="px-6 py-2 text-gray-900 rounded-lg hover:bg-gray-400 transition-colors duration-300 flex items-center justify-center space-x-2"
        style={{ backgroundColor: '#C0C0C0' }}>
        <FiUnlock className="w-5 h-5" />
        <span>Login as {title}</span>
      </button>
      {title === 'Agent'&&(
      <a href='/User-Registeration' className=" px-6 py-2 bg-secondary border border-gray-800 text-black rounded-lg hover:bg-primary/10 transition-colors duration-300">
          Signup as {title}
        </a>
      )}
    
      </div>
     
    </div>
  );
};

export default RoleCard;