import { Link } from "react-router-dom";
import config from "../config.json";
import GitHubButton from 'react-github-btn'


function MainPage({ token }) {
  return (
    <div className="main-wrapper">
      <div className="main-inner">
        <h2>SPARK investment website</h2>
        <p><i>{config.VERSION} created by <a href="https://github.com/Kaminyou">Ming-Yang Ho</a></i></p>
        <GitHubButton href="https://github.com/Kaminyou/Investment-website" aria-label="Star Kaminyou/Investment-website on GitHub">Star</GitHubButton>
        <h5>Invest your favorite group</h5>
        <p>
          Every participant has a budget of <b>{config.MAX_INVEST.toLocaleString("en-US")}</b> dollars
          to distribute among the groups (except his/her own). The dashboard shows the
          latest submission of every participant summed up per group.
        </p>
        <h5>Request</h5>
        {!token ? (
          <p>Please <Link className="pantoneZOZ1a" to={"/sign-in"}>login</Link> first</p>
        ) : (
          <p>Please check the <Link className="pantoneZOZ1a" to={"/request"}>request</Link> page, then watch the <Link className="pantoneZOZ1a" to={"/dashboard"}>dashboard</Link></p>
        )}
      </div>
    </div>
  )
}

export default MainPage
