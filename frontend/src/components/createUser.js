import React, { useState } from "react";
import axios from "axios";
import swal from "sweetalert";
import isEmpty from 'validator/lib/isEmpty'
import isInt from 'validator/lib/isInt'

export default function CreateUser({ token, onCreated }) {
  const [newAccount, setNewAccount] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const sendCreateUserRequest = (e) => {
    e.preventDefault();
    if (isEmpty(newAccount) || isEmpty(newCategory) || isEmpty(newPassword)) {
      swal({
        title: "Error",
        text: "Please provide account, group and password",
        icon: "error",
      });
      return
    }
    if (!isInt(newCategory, { min: 0 })) {
      swal({
        title: "Error",
        text: "Group must be a non-negative whole number",
        icon: "error",
      });
      return
    }
    const formData = new FormData();
    formData.append("account", newAccount.trim());
    formData.append("category", parseInt(newCategory, 10));
    formData.append("password", newPassword)

    setSaving(true);
    axios.post("/api/admin/createuser", formData, {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(() => {
        setNewAccount("");
        setNewCategory("");
        setNewPassword("");
        swal({
          title: "Success",
          text: "Create successfully!",
          icon: "success",
        });
        if (onCreated) onCreated();
      })
      .catch((err) => {
        console.warn(err);
        const serverMsg = err.response && err.response.data && err.response.data.msg;
        swal({
          title: "Error",
          text: serverMsg || "Server error",
          icon: "error",
        });
      })
      .finally(() => setSaving(false));
  }

  return (
    <form onSubmit={sendCreateUserRequest}>
      <h4>Create User</h4>
      <div className="form-group">
        <label htmlFor="formNewAccount">Account</label>
        <input type="text" className="form-control" id="formNewAccount" placeholder="new account" autoComplete="off" value={newAccount} onChange={(e) => setNewAccount(e.target.value)}/>
      </div>

      <div className="form-group">
        <label htmlFor="formNewGroup">Group</label>
        <input type="number" min="0" step="1" className="form-control" id="formNewGroup" placeholder="new group" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}/>
      </div>

      <div className="form-group">
        <label htmlFor="formNewPassword">Password</label>
        <input type="text" className="form-control" id="formNewPassword" placeholder="new password" autoComplete="off" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}/>
      </div>
      <button type="submit" className="btn btn-primary btn-block pantoneZOZl" disabled={saving}>
        {saving ? "Creating..." : "Create"}
      </button>
      <br></br>
    </form>
  );
}
