'use client';
import React, { useEffect, useState } from 'react';
import Modal from 'react-modal';
import { AddUser } from '@/app/Store/Slice';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Loader } from 'lucide-react'; // Import loader icon
import toast, { Toaster } from 'react-hot-toast'; // Import toast for notifications
import { FiLogIn } from 'react-icons/fi'; // Import the login icon
const LoginModal = ({ isOpen, onClose, role }) => {
  const dispatch = useDispatch();
  // const Authenticated = useSelector((data) => data.isAuthenticated);
  const userrole = useSelector((data) => data.user.role);
  const router = useRouter();
  const [loginlink, setloginlink] = useState('admin');

  useEffect(()=>{
    if(role === "Admin"){
      setloginlink("admin")
    }
    else if(role === "Agent"){
      setloginlink("admin/user")
      }
  },[role])
  

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Track loading state

  useEffect(() => {
      if (userrole === 'admin' || userrole === 'superadmin') {
        router.push('/admin-dashboard/analytics');
      } else if (userrole === 'agent') {
        router.push('/agent-dashboard/Analytics');
      }
  }, [userrole]);

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, password } = formData;
    setIsLoading(true); 

    try {
      const response = await axios.post(`/api/${loginlink}/login`, { username, password });

      if (response.status === 200) {
        const { data } = response;
        dispatch(
          AddUser({
            id: data.user.id,
            fullname: data.user.fullname,
            username: data.user.username,
            balance: data.user.balance || 0,
            role: data.user.role,
          })
        );

        toast.success('Login successful! Redirecting to dashboard...');
        setTimeout(() => {
          // Redirect based on role
          if (data.user.role === 'admin' || userrole === 'superadmin') {
            router.push('/admin-dashboard/analytics');
          } else if (data.user.role === 'agent')    
          {
            router.push('/agent-dashboard/Analytics');
          }
        }, 1500);
          //  if (data.user.role === 'agent')    
           
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || 'Error logging in. Please try again later.';
      toast.error(errorMsg);
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-2xl shadow-2xl w-[450px]"
      overlayClassName="fixed inset-0 bg-black/50 backdrop-blur-sm"
    >
      <Toaster /> 
      <div className="flex flex-col space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-primary">{role} Login</h2>
          <p className="text-gray-600 mt-2">Welcome back! Please enter your details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMessage && (
            <div className="text-red-500 text-sm font-medium">{errorMessage}</div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              placeholder="Enter your password"
              required
            />
          </div>

          {/* <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
              />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            <a href="#" className="text-sm text-primary hover:text-primary/80">
              Forgot password?
            </a>
          </div> */}

        <button
          type="submit"
          className="w-full text-gray-900 py-3 rounded-lg hover:bg-gray-400 transition-colors font-medium flex items-center justify-center space-x-2"
          style={{ backgroundColor: '#C0C0C0' }}
        >
          {isLoading ? (
            <Loader className="animate-spin w-5 h-5" />
          ) : (
            <>
              <FiLogIn className="w-5 h-5" /> {/* Login icon */}
              <span>Sign In</span> {/* Text wrapped in span for clarity */}
            </>
          )}
        </button>
        </form>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close modal"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </Modal>
  );
};

export default LoginModal;
