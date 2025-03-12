'use client';

import { toast, ToastContainer } from 'react-toastify';
import { useState, useEffect } from 'react';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  EyeIcon,
} from '@heroicons/react/24/solid';
import { Eye, EyeOffIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader } from 'lucide-react'; // Import loading icon
import 'react-toastify/dist/ReactToastify.css';

// Fetch all users
const fetchUsers = async () => {
  const response = await fetch('/api/admin/user');
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
};

// Add a new user
const addUser = async (user) => {
  const response = await fetch('/api/admin/user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!response.ok) {
    throw new Error('Failed to add user');
  }
  return response.json();
};

// Update an existing user
const updateUser = async (user) => {
  const response = await fetch(`/api/admin/user/${user.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  if (!response.ok) {
    throw new Error('Failed to update user');
  }
  return response.json();
};

// Delete a user
const deleteUser = async (id) => {
  const response = await fetch(`/api/admin/user/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error('Failed to delete user');
  }
  return true;
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(null);
  const [showPassword, setShowPassword] = useState(false); // Track password visibility


  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setFilteredUsers(
      users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [users, searchTerm]);

  const handleAddUser = () => {
    setCurrentUser(null);
    setIsModalOpen(true);
  };

  const handleUpdateUser = (user) => {
    setCurrentUser(user);
    setIsModalOpen(true);
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setLoadingAction(id);
      try {
        await deleteUser(id);
        const updatedUsers = await fetchUsers();
        setUsers(updatedUsers);
        toast.success('User deleted successfully');
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoadingAction(null);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = Object.fromEntries(formData.entries());

    setLoadingAction('form');
    try {
      if (currentUser) {
        const updatedUser = await updateUser({ ...currentUser, ...userData });
        toast.success('User updated successfully');
      } else {
        const newUser = await addUser(userData);
        toast.success('User added successfully');
      }
      // Fetch updated user list
      const updatedUsers = await fetchUsers();
      setUsers(updatedUsers);
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const approveUser = async (id) => {
    const response = await fetch(`/api/admin/user/approve/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error('Failed to approve user');
    }
    return response.json();
  };

  return (
    <div>
      <ToastContainer />
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <Input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-auto"
          />
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleAddUser} className="bg-indigo-600">
                <PlusIcon className="h-5 w-5 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[500px]">
              <DialogHeader>
                <DialogTitle>{currentUser ? 'Update User' : 'Add User'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="">
                <div className='grid grid-cols-2 gap-4 mb-4'>
                  {['name', 'username', 'password', 'phoneno', 'city', 'address', 'bname'].map((field) => (
                    <div key={field} className='relative'>
                      <label htmlFor={field} className="block text-sm font-medium">
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </label>
                      <Input
                        type={field === 'password' && !showPassword ? 'password' : 'text'}
                        name={field}
                        defaultValue={field === 'password' ? '' : currentUser?.[field]}
                      />
                      {field === 'password' && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="btn btn-icon absolute top-[50%] right-4"
                        >
                          {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  ))}
                  {/* Email Verification Dropdown */}
                  {/* Email Verification Dropdown */}
                  <div className="relative">
                    <label htmlFor="emailverification" className="block text-sm font-medium">
                      Email Verification
                    </label>
                    <Select
                      defaultValue={currentUser?.emailverification || 'False'}
                      name="emailverification"
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Verification Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="True">Verified</SelectItem>
                        <SelectItem value="False">Not Verified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Dropdown */}
                  <div className="relative">
                    <label htmlFor="status" className="block text-sm font-medium">
                      Status
                    </label>
                    <Select
                      defaultValue={currentUser?.status || 'Inactive'}
                      name="status"
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {!currentUser&&(
                    <div className="relative">
                    <label htmlFor="role" className="block text-sm font-medium">
                      Role
                    </label>
                    <Select
                      defaultValue={currentUser?.role || 'Customer'}
                      name="role"
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  )}
                  

                </div>
                <Button type="submit" className="w-full" disabled={loadingAction === 'form'}>
                  {loadingAction === 'form' && <Loader className="mr-2 animate-spin" />}
                  {currentUser ? 'Update' : 'Add'} User
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {isLoading ? (
          <div className="flex justify-center">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="overflow-auto max-h-[72vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Email Verified</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user, index) => (
                  <TableRow key={user.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.city}</TableCell>
                    <TableCell>
                      {user.emailverification === 'True' ? (
                        <span className="text-green-600">Verified</span>
                      ) : (
                        <span className="text-red-600">Not Verified</span>
                      )}
                    </TableCell>
                    <TableCell>{user.status}</TableCell>
                    <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            user.role === 'agent'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {user.role}
                        </span>
                    </TableCell> 
                    <TableCell>
                      <Button onClick={() => handleUpdateUser(user)} variant="ghost">
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      {user.id==15? '': <Button
                        onClick={() => handleDeleteUser(user.id)}
                        variant="ghost"
                        className="text-red-600"
                        disabled={loadingAction === user.id}
                      >
                        {loadingAction === user.id ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </Button>}
                     
                      {/* <Button
                        onClick={() => handleApproveUser(user.id)}
                        variant="ghost"
                        className="text-blue-600"
                        disabled={loadingAction === user.id || user.status === 'Approved'}
                      >
                        {loadingAction === user.id ? (
                          <Loader className="h-4 w-4 animate-spin" />
                        ) : (
                          'Approve'
                        )}
                      </Button> */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
