import { useState } from 'react';
import logo from './img/logo.png';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Switch, Route, Link } from "react-router-dom";

import useToken from './components/useToken'
import ScrollToTop from './components/ScrollToTop'
import RequestPage from "./container/request.container"
import Login from "./container/login.container";
import MainPage from "./container/main.container"
import LogOut from "./container/logout.container"
import DashBoard from "./container/dashboard.container"
import AdminPage from "./container/admin.container"
import PersonalPage from "./container/personal.container"

function App() {
  const { token, isAdmin, removeToken, setToken } = useToken();
  const [navOpen, setNavOpen] = useState(false);
  const closeNav = () => setNavOpen(false);

  const NavItem = ({ to, children }) => (
    <li className="nav-item">
      <Link className="nav-link" to={to} onClick={closeNav}>{children}</Link>
    </li>
  );

  return (
    <div className="App">
      <ScrollToTop />
      <nav className="navbar navbar-expand-lg navbar-light fixed-top">
        <div className="container">
          <Link className="navbar-brand" to={"/"} onClick={closeNav}>
            <img src={logo} width="30" height="30" alt=""/>
            SPARK investment website
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            aria-controls="mainNav"
            aria-expanded={navOpen}
            aria-label="Toggle navigation"
            onClick={() => setNavOpen((open) => !open)}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className={"collapse navbar-collapse" + (navOpen ? " show" : "")} id="mainNav">
            {!token ? (
              <ul className="navbar-nav ml-auto">
                <NavItem to="/sign-in">Login</NavItem>
              </ul>
            ):(
              <ul className="navbar-nav ml-auto">
                {isAdmin && <NavItem to="/admin">Admin</NavItem>}
                <NavItem to="/personal">Personal</NavItem>
                <NavItem to="/request">Request</NavItem>
                <NavItem to="/dashboard">Dashboard</NavItem>
                <NavItem to="/logout">Logout</NavItem>
              </ul>
            )}
          </div>
        </div>
      </nav>
      <div>
        <Switch>
          <Route exact path='/'>
            <MainPage token={token} />
          </Route>
          <Route exact path='/request'>
            <RequestPage token={token} />
          </Route>
          <Route exact path='/dashboard'>
            <DashBoard token={token} />
          </Route>
          <Route exact path='/sign-in'>
            <Login setToken={setToken} />
          </Route>
          <Route exact path='/logout'>
            <LogOut removeToken={removeToken} />
          </Route>
          <Route exact path='/admin'>
            <AdminPage token={token} />
          </Route>
          <Route exact path='/personal'>
            <PersonalPage token={token} />
          </Route>
        </Switch>
      </div>
    </div>
  );
}

export default App;
