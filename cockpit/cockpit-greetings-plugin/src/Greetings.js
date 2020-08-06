import React, { useState, useEffect } from "react";

const base = document.querySelector("base");
const adminApi = base.getAttribute("admin-api");

function Greetings({ CSRFToken }) {
  const [user, setUser] = useState();

  useEffect(() => {
    fetch(adminApi + "auth/user/default", {
      headers: {
        "Accept": "application/json",
        "X-XSRF-TOKEN": CSRFToken,
      },
    }).then(async (res) => {
      setUser(await res.json());
    });
  }, [setUser, CSRFToken]);

  if (!user) {
    return <span>Loading...</span>;
  }
  return <h3>Welcome {user.userId}, have a nice day!</h3>;
}

export default Greetings;