"use client";
import { toast, ToastContainer } from "react-toastify";
import { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  TableFooter,
} from "@mui/material";
import { Edit as PencilIcon, Delete as TrashIcon, Add as PlusIcon, Download as DownloadIcon } from "@mui/icons-material";
import "react-toastify/dist/ReactToastify.css";
import { useSelector } from "react-redux";

// Fetch all expenses
const fetchExpenses = async () => {
  const response = await fetch("/api/admin/expense");
  if (!response.ok) {
    throw new Error("Failed to fetch expenses");
  }
  const result = await response.json();
  console.log("Fetched expenses:", result);
  return result.data;
};

// Add a new expense with image path
const addExpense = async (expenseData) => {
  console.log("Sending expense data:", expenseData);
  const response = await fetch("/api/admin/expense", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expenseData),
  });
  const result = await response.json();
  console.log("Add expense response:", result);
  if (!response.ok) {
    throw new Error(result.error || "Failed to add expense");
  }
  return result.data;
};

// Update an existing expense with image path
const updateExpense = async (expenseData) => {
  const response = await fetch(`/api/admin/expense`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expenseData),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Failed to update expense");
  }
  return result.data;
};

// Delete an expense
const deleteExpense = async (id) => {
  const response = await fetch(`/api/admin/expense/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error("Failed to delete expense");
  }
  return true;
};

// Convert file to Base64 (full data URL)
const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Upload image to server
const uploadImageToServer = async (base64Image) => {
  try {
    const uploadApiUrl = process.env.NEXT_PUBLIC_IMAGE_UPLOAD_API;
    const response = await fetch(uploadApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Image }),
    });
    const data = await response.json();
    if (!response.ok || !data.image_url) {
      throw new Error(data.error || "Failed to upload image");
    }
    const fullPath = `${process.env.NEXT_PUBLIC_IMAGE_UPLOAD_PATH}/${data.image_url}`;
    return fullPath;
  } catch (error) {
    throw error;
  }
};

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const adminId = useSelector((state) => state.user.id);

  useEffect(() => {
    fetchExpenses()
      .then((data) => {
        // Filter expenses by adminId
        const adminExpenses = data.filter((expense) => expense.adminId === adminId);
        setExpenses(adminExpenses);
        setFilteredExpenses(adminExpenses);
      })
      .catch((err) => {
        toast.error(err.message);
        setExpenses([]);
      })
      .finally(() => setIsLoading(false));
  }, [adminId]); // Add adminId as dependency to refetch if it changes

  useEffect(() => {
    setFilteredExpenses(
      expenses.filter(
        (expense) =>
          expense.expense_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          expense.expense_description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [expenses, searchTerm]);

  const handleAddExpense = () => {
    setCurrentExpense(null);
    setImageFile(null);
    setImagePreview(null);
    setIsModalOpen(true);
  };

  const handleUpdateExpense = (expense) => {
    setCurrentExpense(expense);
    setImageFile(null);
    setImagePreview(expense.imagePath || null);
    setIsModalOpen(true);
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      setLoadingAction(id);
      try {
        await deleteExpense(id);
        const updatedExpenses = await fetchExpenses();
        const adminExpenses = updatedExpenses.filter((expense) => expense.adminId === adminId);
        setExpenses(adminExpenses);
        toast.success("Expense deleted successfully");
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoadingAction(null);
      }
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setImageFile(file);
        const base64Image = await convertToBase64(file);
        setImagePreview(base64Image);
      } catch (error) {
        toast.error("Failed to convert image to Base64");
      }
    }
  };

  const handleDownloadImage = () => {
    if (imagePreview) {
      const link = document.createElement("a");
      link.href = imagePreview;
      link.download = `expense_${currentExpense?.id || "new"}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    let expenseData = {
      adminId: adminId,
      expense_title: formData.get("expense_title"),
      expense_description: formData.get("expense_description") || "",
      amount: parseFloat(formData.get("amount")),
      added_by: adminId,
      imagePath: currentExpense?.imagePath || "",
    };
    if (currentExpense) {
      expenseData.id = currentExpense.id;
    }

    setLoadingAction("form");
    try {
      if (imageFile) {
        const base64Image = await convertToBase64(imageFile);
        const uploadedImagePath = await uploadImageToServer(base64Image);
        expenseData.imagePath = uploadedImagePath;
      }

      console.log("Form data being sent:", expenseData);

      if (currentExpense) {
        await updateExpense(expenseData);
        toast.success("Expense updated successfully");
      } else {
        await addExpense(expenseData);
        toast.success("Expense added successfully");
      }
      const updatedExpenses = await fetchExpenses();
      const adminExpenses = updatedExpenses.filter((expense) => expense.adminId === adminId);
      setExpenses(adminExpenses);
      setIsModalOpen(false);
      setImageFile(null);
      setImagePreview(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction(null);
    }
  };

  // Calculate total amount
  const totalAmount = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  return (
    <Box>
      <ToastContainer />
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <TextField
            label="Search expenses by title or description..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: "300px" }}
          />
          <Button
            variant="contained"
            color="success"
            onClick={handleAddExpense}
            startIcon={<PlusIcon />}
          >
            Add Expense
          </Button>
        </Box>

        {isLoading ? (
          <Box display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: "72vh", overflow: "auto" }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>No.</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Image</TableCell>
                  <TableCell>Added By</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Updated At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExpenses.map((expense, index) => (
                  <TableRow key={expense.id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{expense.admin?.username || "N/A"}</TableCell>
                    <TableCell>{expense.expense_title}</TableCell>
                    <TableCell>{expense.expense_description}</TableCell>
                    <TableCell>${parseFloat(expense.amount).toFixed(2)}</TableCell>
                    <TableCell>
                      {expense.imagePath ? (
                        <img
                          src={expense.imagePath}
                          alt="Expense"
                          style={{ maxWidth: "50px", maxHeight: "50px", borderRadius: "4px" }}
                        />
                      ) : (
                        "No Image"
                      )}
                    </TableCell>
                    <TableCell>{expense.added_by}</TableCell>
                    <TableCell>{new Date(expense.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(expense.updatedAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleUpdateExpense(expense)}>
                        <PencilIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDeleteExpense(expense.id)}
                        color="error"
                        disabled={loadingAction === expense.id}
                      >
                        {loadingAction === expense.id ? (
                          <CircularProgress size={20} />
                        ) : (
                          <TrashIcon fontSize="small" />
                        )}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} align="right">
                    <Typography variant="subtitle1" fontWeight="bold">
                      Total Amount:
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle1" fontWeight="bold">
                      ${totalAmount.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell colSpan={5} /> {/* Empty cells to align with table */}
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        )}

        <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>{currentExpense ? "Update Expense" : "Add Expense"}</DialogTitle>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2} mb={2} mt={2}>
                <TextField
                  label="Expense Title"
                  name="expense_title"
                  defaultValue={currentExpense?.expense_title}
                  variant="outlined"
                  required
                  fullWidth
                />
                <TextField
                  label="Amount"
                  name="amount"
                  type="number"
                  defaultValue={currentExpense?.amount}
                  variant="outlined"
                  inputProps={{ step: "0.01" }}
                  required
                  fullWidth
                />
                <TextField
                  label="Expense Description"
                  name="expense_description"
                  defaultValue={currentExpense?.expense_description}
                  variant="outlined"
                  multiline
                  rows={4}
                  fullWidth
                />
                <Box>
                  <Button variant="outlined" component="label" fullWidth>
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleImageChange}
                    />
                  </Button>
                  {imagePreview && (
                    <Box mt={2} display="flex" alignItems="center" gap={2}>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "4px" }}
                      />
                      {currentExpense && !imageFile && (
                        <IconButton onClick={handleDownloadImage} color="primary" title="Download Image">
                          <DownloadIcon />
                        </IconButton>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
              <Button
                type="submit"
                variant="contained"
                color="success"
                fullWidth
                disabled={loadingAction === "form"}
                startIcon={loadingAction === "form" ? <CircularProgress size={20} /> : null}
              >
                {currentExpense ? "Update" : "Add"} Expense
              </Button>
            </form>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsModalOpen(false)} color="error">
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}