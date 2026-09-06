import { useState } from 'react';
import { useHistory } from "react-router-dom";
import axios from "axios";
import swal from "sweetalert";

function Login({ setToken }) {
  const history = useHistory();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleAccountChange = (e) => {
    setAccount(e.target.value)
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
  }

  const logMeIn = (e) => {
    e.preventDefault();
    if (!account || !password) {
      swal({
        title: "Error",
        text: "Please provide account and password",
        icon: "error",
      });
      return;
    }
    setSubmitting(true);
    axios({
      method: "POST",
      url: "/api/token",
      data: {
        account: account,
        password: password,
      }
    }).then((response) => {
      setToken(response.data.access_token)
      setAccount("")
      setPassword("")
      history.push({
        pathname: "/",
      });
    }).catch((error) => {
      setPassword("")
      swal({
        title: "Error",
        text: error.response ? "Wrong account or password" : "Cannot reach the server",
        icon: "error",
      });
    }).finally(() => {
      setSubmitting(false);
    })
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-inner">
        <form onSubmit={logMeIn}>
          <h3>Login</h3>
          <div className="form-group">
            <label htmlFor="loginAccount">Account</label>
            <input type="text" className="form-control" id="loginAccount" name="account" autoComplete="username" placeholder="Enter your account" onChange={handleAccountChange} value={account}/>
          </div>
          <div className="form-group">
            <label htmlFor="loginPassword">Password</label>
            <input type="password" className="form-control" id="loginPassword" name="password" autoComplete="current-password" placeholder="Enter password" onChange={handlePasswordChange} value={password}/>
          </div>
          <button type="submit" className="btn btn-primary btn-block pantoneZOZl" disabled={submitting}>
            {submitting ? "Signing in..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
