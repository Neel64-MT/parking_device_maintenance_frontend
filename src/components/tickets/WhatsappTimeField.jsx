import { Field } from '../ui/FilterBar'
import { localInputNow } from '../../utils/dateTime'

/** Optional time the ticket / update was posted in the WhatsApp group (`datetime-local` value). */
export function WhatsappTimeField({ value, onChange, disabled, style }) {
  return (
    <Field
      label="Reported time"
      hint="Optional. When the issue was actually reported (for example, the WhatsApp message time); leave empty to use the time you save."
      style={style}
    >
      <input
        type="datetime-local"
        value={value}
        max={localInputNow()}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </Field>
  )
}
