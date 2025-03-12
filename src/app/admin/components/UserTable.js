import React from 'react'
import { PencilIcon, TrashIcon, UserCircleIcon } from '@heroicons/react/24/solid'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function UserTable({ users, onUpdate, onDelete }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold text-gray-600">Full Name</TableHead>
            <TableHead className="font-semibold text-gray-600">Username</TableHead>
            <TableHead className="font-semibold text-gray-600">Role</TableHead>
            <TableHead className="font-semibold text-gray-600">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => (
            <TableRow key={user.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <TableCell className="font-medium">
                <div className="flex items-center space-x-3">
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  <span>{user.fullname}</span>
                </div>
              </TableCell>
              <TableCell>{user.username}</TableCell>
              <TableCell>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  user.role === 'admin' 
                    ? 'bg-indigo-100 text-indigo-800' 
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {user.role}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button
                    onClick={() => onUpdate(user)}
                    variant="outline"
                    size="sm"
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => onDelete(user.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-800"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

