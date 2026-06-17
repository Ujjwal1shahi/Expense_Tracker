import React from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import Landing from "./pages/Landing";
import Signup from "./pages/auth/Signup";
import Signin from "./pages/auth/Signin";
import Dashboard from "./pages/Dashboard";
import Transaction from "./pages/Transaction";
import Settings from "./pages/Settings";
import AccountPage from "./pages/AccountPage";
import useStore from "./store";

const RootLayout = () => {
  const user = useStore((state) => state);
  console.log(user);

  return !user ? (
    <Navigate to="sign-in" replace={true} />
  ) : (
    <>
       <div className="min-h-[cal(h-screen-100px)]">
        <Outlet />
       </div>
    </>
  );
};

const App = () => {
  return(
  <main>
    <div className="">
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
