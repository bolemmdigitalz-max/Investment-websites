import React, { useState, useEffect, useCallback } from "react";
import { useHistory } from "react-router-dom";
import axios from "axios";
import swal from "sweetalert";
import NoAuth from '../components/noAuth'
import config from "../config.json";
import GROUPS, { emptyAmounts, sumAmounts, toInt } from "../groups";

const formatDollars = (n) => n.toLocaleString("en-US");

function RequestPage({ token }) {
  const history = useHistory();

  const [amounts, setAmounts] = useState(emptyAmounts);
  const [ownGroup, setOwnGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const total = sumAmounts(amounts);
  const leftDollar = config.MAX_INVEST - total;

  const fetchDefault = useCallback(async () => {
    const headers = { Authorization: 'Bearer ' + token };
    try {
      const [donationRes, userRes] = await Promise.all([
        axios.get("/api/personal/donation", { headers }),
        axios.get("/api/personal/listuser", { headers }),
      ]);
      const record = donationRes.data.record || {};
      setAmounts((prev) => {
        const next = { ...prev };
        GROUPS.forEach((g) => { next[g.key] = toInt(record[g.key]); });
        return next;
      });
      const me = userRes.data.currentUsers && userRes.data.currentUsers[0];
      setOwnGroup(me ? me.group : null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchDefault();
  }, [token, fetchDefault]);

  const handleChange = (key) => (e) => {
    const value = e.target.value;
    setAmounts((prev) => ({ ...prev, [key]: value === "" ? "" : value }));
  }

  const onSubmit = (e) => {
    e.preventDefault();

    for (const g of GROUPS) {
      const value = toInt(amounts[g.key]);
      if (value < 0 || value > config.MAX_INVEST) {
        swal({
          title: "Error",
          text: `Please provide a valid value for ${g.label} (0 - ${formatDollars(config.MAX_INVEST)})`,
          icon: "error",
        });
        return;
      }
    }

    if (total > config.MAX_INVEST) {
      swal({
        title: "Error",
        text: "Total investment over " + formatDollars(config.MAX_INVEST),
        icon: "error",
      });
      return;
    }

    const formData = new FormData();
    GROUPS.forEach((g) => formData.append(g.key, toInt(amounts[g.key])));

    setSubmitting(true);
    axios.post("/api/submit/donation", formData, {
      headers: { Authorization: 'Bearer ' + token }
    })
      .then(() => {
        swal({
          title: "Success",
          text: "Submit Success!",
          icon: "success",
        }).then(() => {
          history.push({ pathname: "/dashboard" });
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
      .finally(() => setSubmitting(false));
  }

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
        <form onSubmit={onSubmit}>
          <h3>Investment!</h3>
          <h5 className={leftDollar < 0 ? "text-danger" : ""}>
            You are left with {formatDollars(leftDollar)} dollars
          </h5>
          {ownGroup !== null && (
            <p className="text-muted">
              You belong to group {ownGroup}; any amount entered for your own group is ignored.
            </p>
          )}

          <h4>Group list</h4>

          {loading ? (
            <p>Loading...</p>
          ) : (
            GROUPS.map((g) => (
              <div className="form-group" key={g.key}>
                <label htmlFor={`input-${g.key}`}>
                  {g.label}{ownGroup === g.number ? " (your group)" : ""}
                </label>
                <input
                  type="number"
                  min="0"
                  max={config.MAX_INVEST}
                  step="1"
                  className="form-control"
                  id={`input-${g.key}`}
                  placeholder="value"
                  value={amounts[g.key]}
                  disabled={ownGroup === g.number}
                  onChange={handleChange(g.key)}
                />
              </div>
            ))
          )}
          <button
            type="submit"
            className="btn btn-primary btn-block pantoneZOZl"
            disabled={loading || submitting || leftDollar < 0}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default RequestPage
