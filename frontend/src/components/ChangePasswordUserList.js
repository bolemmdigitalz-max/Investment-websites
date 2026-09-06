import { useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import axios from "axios";
import swal from "sweetalert";
import isEmpty from 'validator/lib/isEmpty'

/**
 * Renders a table of users, each with a "Change password" button that opens
 * a dialog. `endpoint` selects the backend route:
 *   - /api/admin/changepwd    (admin changes any user's password)
 *   - /api/personal/changepwd (user changes his/her own password)
 */
export default function ChangePasswordUserList({ userlist, token, endpoint, title, accountPrefix = "" }) {
  const [open, setOpen] = useState(false);
  const [targetAccount, setTargetAccount] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleClickOpen = (account) => {
    setTargetAccount(account);
    setNewPassword("");
    setOpen(true);
  };

  const handleClose = () => {
    setTargetAccount("");
    setNewPassword("");
    setOpen(false);
  };

  const handleChangePassword = () => {
    if (isEmpty(targetAccount) || isEmpty(newPassword)) {
      swal({
        title: "Error",
        text: "Please provide password",
        icon: "error",
      });
      return
    }
    const formData = new FormData();
    formData.append("account", targetAccount);
    formData.append("password", newPassword)

    setSaving(true);
    axios.post(endpoint, formData, {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(() => {
        handleClose();
        swal({
          title: "Success",
          text: "Change successfully!",
          icon: "success",
        });
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
    <div>
      <h4>{title}</h4>
      {userlist.length === 0 ? (
        <p className="text-muted">No users yet.</p>
      ) : (
        <table className="table table-sm user-table">
          <thead>
            <tr>
              <th>Account</th>
              <th>Group</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {userlist.map((user) => (
              <tr key={user.account}>
                <td><b>{accountPrefix}{user.account}</b></td>
                <td><b>Group {user.group}</b></td>
                <td className="text-right">
                  <Button variant="outlined" size="small" onClick={() => handleClickOpen(user.account)}>
                    Change password
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Change password</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To change the password of <b>{targetAccount}</b>
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="new-password"
            label="New password"
            type="password"
            fullWidth
            variant="standard"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleChangePassword(); }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleChangePassword} disabled={saving}>Change</Button>
        </DialogActions>
      </Dialog>
      <br></br>
    </div>
  );
}
