'use client'
import Navbar from './dashboard/navbar/navbar';
import Sidebar from './dashboard/sidebar/sidebar';
import { ToastContainer } from "react-toastify";
import { Providers } from '../Store/Provider';

const Layout = ({ children }) => {
  return (
    <Providers>
    <div className="flex w-full min-h-screen bg-white">
      <div className="flex w-[350px]">
        <ToastContainer />
        <Sidebar />
      </div>
      <div className="flex flex-col w-full flex-grow">
        <Navbar />
        <div className="p-2">
          {children}
        </div>
      </div>
    </div>
    </Providers>
  );
};

export default Layout;
