import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: {},
  isAuthenticated: false,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Action to add user and set authentication status
    AddUser(state, action) {
      const { id, fullname, username, balance, role } = action.payload; // Extract properties, provide default value for balance
      const userData = {
        id,
        fullname,
        username,
        balance,
        role,
      };

      // Update the state
      state.user = userData;
      state.isAuthenticated = true;
    },

    // Action to log out the user
    Logout(state) {
      state.user = {};
      state.isAuthenticated = false;
    },

    // Action to update user details
    UpdateUser(state, action) {
      const { id, fullname, username, balance, role } = action.payload; // Update user with new payload
      state.user = {
        ...state.user, // Retain existing user data
        id: id ?? state.user.id, // Update if provided, else keep current value
        fullname: fullname ?? state.user.fullname,
        username: username ?? state.user.username,
        balance: balance ?? state.user.balance,
        role: role ?? state.user.role,
      };
    },
  },
});

// Export actions for dispatching
export const { AddUser, Logout, UpdateUser } = userSlice.actions;

// Export the reducer to be used in the store
export default userSlice.reducer;
