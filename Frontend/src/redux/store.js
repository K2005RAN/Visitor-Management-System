import { combineReducers, configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice";
import themeSlice from "./slices/themeSlice";
import { commonApi } from "./api/commonApi.js";

import {
  persistStore, // Added this import
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

const persistConfig = {
  key: "root",
  version: 1,
  storage,
  // We blacklist the API cache so it doesn't save old search results
  blacklist: [commonApi.reducerPath],
};

const rootReducer = combineReducers({
  auth: authSlice,
  theme: themeSlice,
  [commonApi.reducerPath]: commonApi.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(commonApi.middleware),
});

// CRITICAL: This allows main.jsx to delay rendering until the data is loaded
export const persistor = persistStore(store); 

export default store;