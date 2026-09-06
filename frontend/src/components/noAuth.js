import { Link } from "react-router-dom";

export default function NoAuth() {
  return (
    <div>
      <h4>Please login first</h4>
      <p>You need to <Link className="pantoneZOZ1a" to={"/sign-in"}>login</Link> to see this page.</p>
    </div>
  );
}
