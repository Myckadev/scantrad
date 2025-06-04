import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {CssBaseline} from "@mui/material";
import {store} from "./app/store";
import {Provider } from "react-redux";

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <CssBaseline />
    <App />
  </Provider>,
)
