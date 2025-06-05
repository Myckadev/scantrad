import {BrowserRouter, Route, Routes} from "react-router-dom";
import {DummyComponent} from "./features/dummy-feature/DummyComponent.tsx";
import {DefaultLayout} from "./app/components/DefaultLayout.tsx";
import LoginForm from "./features/auth/LoginForm.tsx";

export default function App() {
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DefaultLayout />} >
            <Route path="/login" element={<LoginForm />} />
            <Route path="/:id" element={<DummyComponent />} />
          </Route>
        </Routes>
      </BrowserRouter>
  );
}
