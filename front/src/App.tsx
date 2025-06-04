import { Typography } from "@mui/material";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import {DummyComponent} from "./features/dummy-feature/DummyComponent";

export default function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Typography> Page d'accueil </Typography>} />
        <Route path="/test" element={<DummyComponent />} />
      </Routes>
    </BrowserRouter>
  )

}