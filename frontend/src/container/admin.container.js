import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import UserList from '../components/adminUserList'
import CreateUser from '../components/createUser'
import NoAuth from '../components/noAuth'

export default function AdminPage({ token }) {
  const [userList, setUserList] = useState([]);
  const [isAdmin, setIsAdmin] = useState(null); // null = unknown yet

  const getUserList = useCallback(async () => {
    try {
      const res = await axios.get("/api/admin/listuser", {
        headers: { Authorization: 'Bearer ' + token }
      });
      setUserList(res.data.currentUsers || []);
      setIsAdmin(true);
    } catch (error) {
      console.error(error);
      setIsAdmin(false);
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
        {isAdmin === null ? (
          <p>Loading...</p>
        ) : !isAdmin ? (
          <p>You are not admin</p>
        ) : (
          <>
            <CreateUser token={token} onCreated={getUserList} />
            <UserList userlist={userList} token={token} />
          </>
        )}
      </div>
    </div>
  );
}
