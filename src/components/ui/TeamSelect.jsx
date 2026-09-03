import { TEAM } from '../../data/team'

/**
 * Assignee / handover select — fillTeam from app.js
 */
export function TeamSelect({
  id,
  value,
  onChange,
  firstOption,
  className,
  ...rest
}) {
  return (
    <select id={id} value={value} onChange={onChange} className={className} {...rest}>
      {firstOption != null ? <option value={firstOption}>{firstOption}</option> : null}
      {TEAM.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  )
}
