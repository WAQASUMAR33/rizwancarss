// store.js
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // You can use sessionStorage or custom storage as needed
import userReducer from './Slice'; 
import { PersistGate } from 'redux-persist/integration/react';

const persistConfig = {
  key: 'root', 
  storage, 
  whitelist: ['user'], 
};

const reducer = persistReducer(persistConfig, userReducer);

const Store = configureStore({
  reducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

const Persistori = persistStore(Store);

export { Store, Persistori };
