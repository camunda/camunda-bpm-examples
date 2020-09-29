import React, { useState, useEffect } from "react";


function Greetings({ camundaAPI }) {
  const [user, setUser] = useState();

  useEffect(() => {
    fetch(camundaAPI.adminApi + "/auth/user/default", {
      headers: {
        "Accept": "application/json",
        "X-XSRF-TOKEN": camundaAPI.CSRFToken,
      },
    }).then(async (res) => {
      setUser(await res.json());
    });
  }, [setUser, camundaAPI.CSRFToken]);

  if (!user) {
    return <span>Loading...</span>;
  }
  return <h3>Welcome {user.userId}, have a nice day!</h3>;
}

export default Greetings;