import { useHistory } from "react-router-dom";
import axios from "axios";

function LogOut({ removeToken }) {
  const history = useHistory();

  const logMeOut = () => {
    // The token lives in localStorage, so the client-side removal is what
    // actually logs the user out; the server call is best effort.
    axios({
      method: "POST",
      url: "/api/logout",
    }).catch((error) => {
      console.warn("Logout request failed", error);
    }).finally(() => {
      removeToken();
      history.push({
        pathname: "/",
      });
    });
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-inner">
        <h3>Log out?</h3>
        <button type="button" className="btn btn-primary btn-block pantoneZOZl" onClick={logMeOut}>Logout</button>
      </div>
    </div>
  )
}

export default LogOut
