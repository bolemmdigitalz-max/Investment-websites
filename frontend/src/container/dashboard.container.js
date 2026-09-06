import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import NoAuth from '../components/noAuth'
import InvestmentBar from '../components/SimpleBar'
import config from "../config.json";

function DashBoard({ token }) {
  const [apiData, setApiData] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  const getDashBoard = useCallback(async () => {
    try {
      const res = await axios.get("/api/dashboard/donation", {
        headers: { Authorization: 'Bearer ' + token }
      });
      setApiData(res.data.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Could not load the dashboard");
    } finally {
      setLoaded(true);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    getDashBoard();
    const interval = setInterval(getDashBoard, config.REFRESH_DURATION);
    return () => clearInterval(interval);
  }, [token, getDashBoard]);

  const total = apiData.reduce((sum, item) => sum + (item.dollars || 0), 0);

  return (
    <div className="main-wrapper">
      <div className="main-inner">
        {!token ? (
          <NoAuth />
        ) : (
          <>
            <h3>Dashboard</h3>
            <p className="text-muted">
              Total invested: <b>{total.toLocaleString("en-US")}</b> dollars
              (refreshes every {Math.round(config.REFRESH_DURATION / 1000)} s)
            </p>
            {error && <p className="text-danger">{error}</p>}
            {!loaded ? (
              <p>Loading...</p>
            ) : (
              <InvestmentBar data={apiData} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default DashBoard
