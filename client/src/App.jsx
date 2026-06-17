import React from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import Landing from "./pages/Landing";
import Signup from "./pages/auth/Signup";
import Signin from "./pages/auth/Signin";
import Dashboard from "./pages/Dashboard";
import Transaction from "./pages/Transaction";
import Settings from "./pages/Settings";
import AccountPage from "./pages/AccountPage";

const RootLayout = () => {
  const user = null;

  return !user ? (
    <Navigate to="sign-in" />
  ) : (
    <>
       <div>
        <Outlet />
       </div>
    </>
  );
};

const App = () => {
  return(
  <main>
    <div>
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/overview" element={<Dashboard />} />
          <Route path="/transactions" element={<Transaction />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/account" element={<AccountPage />} />
        </Route>
        <Route path="/sign-in" element={<Signin />} />
        <Route path="/sign-up" element={<Signup />} />
      </Routes>
    </div>
  </main>
  );
};

export default App;
