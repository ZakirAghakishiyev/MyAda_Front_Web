import React, { useState } from 'react'
import { getSchedulingUserId, setSchedulingUserId } from '../../utils/schedulingUserId'
import { SCHEDULING_DEV_USER_ID_HEADER } from '../../api/schedulingConfig'

/**
 * Dev header for scheduling microservice must match instructor_user_id.
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
        type="text"
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        placeholder="Auth UUID or numeric id (e.g. 00000000-0000-0000-0000-000000000041)"
        value={value}
        onChange={(e) => persist(e.target.value)}
        onBlur={() => setSchedulingUserId(value)}
      />
      <p className="sched-ms-user-bar-hint">
        Sent as <code>{SCHEDULING_DEV_USER_ID_HEADER}</code> for preferences, session edits, and publish. If your JWT
        already carries a valid instructor id, you can leave this empty. Value is stored for this browser session only.
      </p>
    </div>
  )
}
