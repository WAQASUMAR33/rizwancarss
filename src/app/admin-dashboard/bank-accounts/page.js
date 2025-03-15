"use client";

import { toast, ToastContainer } from "react-toastify";
import { useState, useEffect } from "react";
import {
  Edit as PencilIcon,
  Delete as TrashIcon,
  Add as PlusIcon,
} from "@mui/icons-material";
import { Button, TextField, CircularProgress } from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
} from "@mui/material";
import "react-toastify/dist/ReactToastify.css";

// Fetch all bank accounts
const fetchBankAccounts = async () => {
  const response = await fetch("/api/admin/bank-account");
  if (!response.ok) {
    throw new Error("Failed to fetch bank accounts");
  }
  const data = await response.json();
  return data.data || []; // Adjust based on API response structure
};

// Add a new bank account
const addBankAccount = async (account) => {
  const response = await fetch("/api/admin/bank-account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(account),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to add bank account");
  }
  return response.json();
};

// Update an existing bank account
const updateBankAccount = async (account) => {
  const response = await fetch(`/api/admin/bank-account/${account.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(account),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to update bank account");
  }
  return response.json();
};

// Delete a bank account
const deleteBankAccount = async (id) => {
  const response = await fetch(`/api/admin/bank-account/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to delete bank account");
  }
  return true;
};

export default function BankAccountManagement() {
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(null);

  useEffect(() => {
    fetchBankAccounts()
      .then((data) => {
        setAccounts(data);
        setFilteredAccounts(data);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setFilteredAccounts(
      accounts.filter(
        (account) =>
          account.bank_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.account_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.account_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.banno.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.swiftcode.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [accounts, searchTerm]);

  const handleAddAccount = () => {
    setCurrentAccount(null);
    setIsModalOpen(true);
  };

  const handleUpdateAccount = (account) => {
    setCurrentAccount(account);
    setIsModalOpen(true);
  };

  const handleDeleteAccount = async (id) => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      setLoadingAction(id);
      try {
        await deleteBankAccount(id);
        const updatedAccounts = await fetchBankAccounts();
        setAccounts(updatedAccounts);
        toast.success("Account deleted successfully");
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
    const accountData = Object.fromEntries(formData.entries());

    // Ensure empty fields are sent as empty strings to match schema defaults
    const sanitizedData = {
      bank_title: accountData.bank_title || "",
      account_title: accountData.account_title || "",
      account_no: accountData.account_no || "",
      banno: accountData.banno || "",
      swiftcode: accountData.swiftcode || "",
    };

    setLoadingAction("form");
    try {
      if (currentAccount) {
        await updateBankAccount({ id: currentAccount.id, ...sanitizedData });
        toast.success("Account updated successfully");
      } else {
        await addBankAccount(sanitizedData);
        toast.success("Account added successfully");
      }
      const updatedAccounts = await fetchBankAccounts();
      setAccounts(updatedAccounts);
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div>
      <ToastContainer />
      <div style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <TextField
            label="Search accounts..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "300px" }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<PlusIcon />}
            onClick={handleAddAccount}
          >
            Add Account
          </Button>
        </div>

        <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <DialogTitle>{currentAccount ? "Update Account" : "Add Account"}</DialogTitle>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                {["bank_title", "account_title", "account_no", "banno", "swiftcode"].map((field) => (
                  <TextField
                    key={field}
                    label={field.replace("_", " ").toUpperCase()}
                    name={field}
                    defaultValue={currentAccount?.[field] || ""}
                    variant="outlined"
                    fullWidth
                  />
                ))}
              </div>
              <DialogActions>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loadingAction === "form"}
                  startIcon={loadingAction === "form" && <CircularProgress size={20} />}
                >
                  {currentAccount ? "Update" : "Add"} Account
                </Button>
              </DialogActions>
            </form>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </div>
        ) : (
          <TableContainer component={Paper} style={{ maxHeight: "72vh", overflow: "auto" }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>No.</TableCell>
                  <TableCell>Bank Title</TableCell>
                  <TableCell>Account Title</TableCell>
                  <TableCell>Account No</TableCell>
                  <TableCell>Ban No</TableCell>
                  <TableCell>Swift Code</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Updated At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAccounts.map((account, index) => (
                  <TableRow key={account.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{account.bank_title}</TableCell>
                    <TableCell>{account.account_title}</TableCell>
                    <TableCell>{account.account_no}</TableCell>
                    <TableCell>{account.banno}</TableCell>
                    <TableCell>{account.swiftcode}</TableCell>
                    <TableCell>{new Date(account.created_at).toLocaleString()}</TableCell>
                    <TableCell>{new Date(account.updated_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleUpdateAccount(account)}
                        variant="outlined"
                        startIcon={<PencilIcon />}
                      />
                      <Button
                        onClick={() => handleDeleteAccount(account.id)}
                        variant="outlined"
                        color="error"
                        disabled={loadingAction === account.id}
                        startIcon={
                          loadingAction === account.id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <TrashIcon />
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </div>
    </div>
  );
}