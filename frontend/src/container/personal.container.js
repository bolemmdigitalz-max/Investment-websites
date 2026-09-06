import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import UserList from '../components/userList'
import NoAuth from '../components/noAuth'

export default function PersonalPage({ token }) {
  const [userList, setUserList] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ok | error

  const getUserList = useCallback(async () => {
    try {
      const res = await axios.get("/api/personal/listuser", {
        headers: { Authorization: 'Bearer ' + token }
      });
      setUserList(res.data.currentUsers || []);
      setStatus("ok");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    getUserList();
  }, [token, getUserList]);

  if (!token) {
    return (
      <div className="main-wrapper">
        <div className="main-inner">
          <NoAuth />
        </div>
      </div>
    );
  }

  return (
    <div className="main-wrapper">
      <div className="main-inner">
        {status === "loading" && <p>Loading...</p>}
        {status === "error" && <p className="text-danger">Could not load your profile.</p>}
        {status === "ok" && <UserList userlist={userList} token={token} />}
      </div>
    </div>
  );
}
