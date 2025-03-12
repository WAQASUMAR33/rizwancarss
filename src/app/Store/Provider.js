'use client'
import { Provider } from "react-redux";
import { Store, Persistori } from "./Store";
import { PersistGate } from "redux-persist/lib/integration/react";

export function Providers({children}){
    return <Provider store={Store}>
        <PersistGate loading={null} persistor={Persistori}>
        {children}
        </PersistGate>
    </Provider>
}