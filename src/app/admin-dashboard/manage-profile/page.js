'use client'
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { Toaster } from 'react-hot-toast';
import { useSelector } from "react-redux";
// import 'react-hot-toast/dist/index.css';
import { toast } from "react-hot-toast";

const ManageProfile = () => {
  const id = useSelector((data) => data.user.id);

  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    password: "",
    role: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Fetch existing data for the admin user
  useEffect(() => {
    if (id) {
      axios
        .get(`/api/admin/adminuser/${id}`)
        .then((response) => {
          const { fullname, username, role } = response.data;
          setFormData({ fullname, username, password: "", role });
          // toast.success("Profile updated successfully");
        })
        .catch((error) => {
          console.error("Error fetching admin data:", error);
          // toast.error("Failed to update profile");
        });
    }
  }, [id]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Handle form submission
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.put(`/api/admin/adminuser/${id}`, formData);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[85vh] w-full flex flex-col justify-center items-center">
      <Toaster position="top-right" />
      <div className="w-[700px] mx-auto p-8 bg-white shadow border rounded-md">
        <h2 className="text-2xl font-bold mb-6">Manage Profile</h2>
        <form onSubmit={handleUpdate} className="space-y-6">
          <div>
            <label htmlFor="fullname" className="block text-lg font-medium mb-2">
              Full Name
            </label>
            <Input
              id="fullname"
              name="fullname"
              value={formData.fullname}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-lg font-medium mb-2">
              Username
            </label>
            <Input
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              disabled
              required
            />
          </div>

          <div className="relative">
            <label htmlFor="password" className="block text-lg font-medium mb-2">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              // required
            />
            <div
              className="absolute inset-y-0 right-3 top-10 flex items-center cursor-pointer"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </div>
          </div>

          <div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Updating..." : "Update Profile"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManageProfile;
