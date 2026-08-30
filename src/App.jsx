import {
  Routes,
  Route,
} from "react-router-dom";

import MainLayout from "./NewMain";

const App = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={<MainLayout />}
      />
    </Routes>
  );
};

export default App;