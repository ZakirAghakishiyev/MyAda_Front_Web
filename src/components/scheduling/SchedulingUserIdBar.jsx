import React, { useState } from 'react'
import { getSchedulingUserId, setSchedulingUserId } from '../../utils/schedulingUserId'

/**
 * Dev header for scheduling microservice: `X-User-Id` must match instructor_user_id.
 */
export default function SchedulingUserIdBar() {
  const [value, setValue] = useState(() => getSchedulingUserId())

  function persist(next) {
    setValue(next)
    setSchedulingUserId(next)
  }

  return (
    <div className="sched-ms-user-bar">
      <label className="sched-ms-user-bar-label" htmlFor="scheduling-user-id">
        Instructor user ID
      </label>
      <input
        id="scheduling-user-id"
        className="sched-ms-user-bar-input"
        type="number"
        min={1}
        placeholder="e.g. 41"
        value={value}
        onChange={(e) => persist(e.target.value)}
        onBlur={() => setSchedulingUserId(value)}
      />
      <p className="sched-ms-user-bar-hint">
        Sent as <code>X-User-Id</code> for preferences, session edits, and publish. Stored for this browser session.
      </p>
    </div>
  )
}
