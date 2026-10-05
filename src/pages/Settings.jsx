import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { PageMeta } from '../context/PageMetaContext'
import { toast, toastApiError, toastApiSuccess } from '../context/ToastContext'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/FilterBar'
import { Panel } from '../components/ui/Panel'
import { PasswordInput } from '../components/ui/PasswordInput'

function ProfileForm({ user, updateProfile }) {
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [mobile, setMobile] = useState(user?.mobile || '')
  const [savingProfile, setSavingProfile] = useState(false)

  async function saveProfile(e) {
    e.preventDefault()
    const fullName = name.trim()
    const emailValue = email.trim()
    const mobileValue = mobile.trim()

    if (fullName.length < 2) {
      toast('Enter your full name.', 'error')
      return
    }
    if (!emailValue) {
      toast('Enter your email.', 'error')
      return
    }
    if (mobileValue.length < 10) {
      toast('Mobile number must be at least 10 digits.', 'error')
      return
    }

    setSavingProfile(true)
    try {
      await updateProfile({
        fullName,
        email: emailValue,
        mobile: mobileValue,
      })
      toastApiSuccess('Profile updated.')
    } catch (err) {
      toastApiError(err, 'Could not update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <Panel title="Profile" subtitle="Your name and contact details" className="settings-panel">
      <form className="settings-form" onSubmit={saveProfile}>
        <div className="form-grid">
          <Field label="Full name" required className="span-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder="Your full name"
            />
          </Field>
          <Field label="Email" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Mobile" required hint="10-digit mobile number.">
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              autoComplete="tel"
              placeholder="9825012345"
            />
          </Field>
          <Field label="Role" className="span-2">
            <input type="text" value={user?.role || '—'} disabled readOnly />
          </Field>
        </div>
        <div className="settings-actions">
          <Button type="submit" variant="primary" disabled={savingProfile}>
            {savingProfile ? 'Saving…' : 'Save profile'}
          </Button>
        </div>
      </form>
    </Panel>
  )
}

function PasswordForm({ changePassword }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  async function savePassword(e) {
    e.preventDefault()
    if (!currentPassword) {
      toast('Enter your current password.', 'error')
      return
    }
    if (newPassword.length < 8) {
      toast('New password must be at least 8 characters.', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      toast('New passwords do not match.', 'error')
      return
    }

    setSavingPassword(true)
    try {
      await changePassword({ currentPassword, newPassword })
      toastApiSuccess('Password updated.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toastApiError(err, 'Could not update password.')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <Panel title="Password" subtitle="Change the password you use to sign in" className="settings-panel">
      <form className="settings-form" onSubmit={savePassword}>
        <div className="form-grid">
          <Field label="Current password" required className="span-2">
            <PasswordInput
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Current password"
            />
          </Field>
          <Field label="New password" required className="span-2" hint="At least 8 characters.">
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="New password"
            />
          </Field>
          <Field label="Confirm new password" required className="span-2">
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Repeat new password"
            />
          </Field>
        </div>
        <div className="settings-actions">
          <Button type="submit" variant="primary" disabled={savingPassword}>
            {savingPassword ? 'Updating…' : 'Update password'}
          </Button>
        </div>
      </form>
    </Panel>
  )
}

/** Browser (Chrome) permission for this device — separate from the saved app preference. */
function browserPermissionStatus({ permission, pushState }) {
  if (pushState === 'unsupported' || permission === 'unsupported') {
    return { label: 'Unsupported', tone: 'is-muted' }
  }
  if (permission === 'granted') return { label: 'Granted', tone: 'is-ok' }
  if (permission === 'denied') return { label: 'Blocked', tone: 'is-bad' }
  return { label: 'Not granted', tone: 'is-warn' }
}

function browserPermissionNote({ pushOn, permission, pushState, pushError }) {
  if (!pushOn) {
    return {
      tone: '',
      text: 'Push notifications are off, so no browser alerts are sent to any of your devices. New tickets still appear under the bell.',
    }
  }
  if (pushState === 'unsupported' || permission === 'unsupported') {
    return { tone: '', text: 'This browser does not support background notifications. Alerts under the bell still work.' }
  }
  if (pushState === 'unavailable') {
    return { tone: '', text: 'Browser push is not configured for this deployment. Alerts under the bell still work.' }
  }
  if (permission === 'denied') {
    return {
      tone: 'is-bad',
      text: 'Notifications are blocked for this site in your browser, so this device will not show alerts (your other signed-in devices still can). To allow them, click the icon next to the address bar, open Site settings and set Notifications to Allow, then reload this page.',
    }
  }
  if (pushState === 'conflict') {
    return {
      tone: 'is-warn',
      text: 'This browser is registered to another account. Sign out of that account here, then enable browser notifications again.',
    }
  }
  if (pushState === 'error') {
    return { tone: 'is-warn', text: pushError || 'Browser notifications could not be enabled on this device.' }
  }
  if (permission === 'default') {
    return { tone: 'is-warn', text: 'Allow browser notifications so alerts reach this device even when the tab is closed.' }
  }
  if (pushState !== 'enabled') {
    return { tone: 'is-warn', text: 'This browser is not registered for alerts yet.' }
  }
  return null
}

function NotificationsPanel({ notificationState }) {
  const {
    permission,
    pushState,
    pushBusy,
    pushError,
    preferences,
    preferencesSaving,
    setPushEnabled,
    setPlaySound,
    requestBrowserPermission,
  } = notificationState
  const pushOn = preferences.pushNotificationsEnabled
  const soundOn = preferences.playNotificationSound
  const status = browserPermissionStatus({ permission, pushState })
  const note = browserPermissionNote({ pushOn, permission, pushState, pushError })
  const canRequest =
    pushOn &&
    permission !== 'denied' &&
    permission !== 'unsupported' &&
    !['unsupported', 'unavailable', 'conflict', 'enabled'].includes(pushState)

  async function togglePush() {
    const next = !pushOn
    try {
      await setPushEnabled(next)
      toastApiSuccess(next ? 'Push notifications turned on.' : 'Push notifications turned off.')
    } catch (err) {
      toastApiError(err, 'Could not update notification settings.')
    }
  }

  async function toggleSound() {
    const next = !soundOn
    try {
      await setPlaySound(next)
      toastApiSuccess(next ? 'Notification sound turned on.' : 'Notification sound turned off.')
    } catch (err) {
      toastApiError(err, 'Could not update notification settings.')
    }
  }

  return (
    <Panel
      title="Notifications"
      subtitle="Saved to your account and applied on every device you sign in to"
      className="settings-panel"
    >
      <div className="settings-pref-list">
        <div className="settings-pref-row">
          <div className="settings-pref-text">
            <strong id="pref-push-label">Push Notifications</strong>
            <p>Receive browser notifications for important updates.</p>
          </div>
          <div className="status-switch">
            <button
              type="button"
              className={`status-switch-track${pushOn ? ' is-on' : ''}`}
              role="switch"
              aria-checked={pushOn}
              aria-labelledby="pref-push-label"
              disabled={preferencesSaving}
              onClick={togglePush}
            >
              <span className="status-switch-knob" />
            </button>
            <span className="status-switch-label">{pushOn ? 'On' : 'Off'}</span>
          </div>
        </div>

        <div className="settings-pref-row">
          <div className="settings-pref-text">
            <strong>Browser Permission</strong>
            <p>Controlled by your browser for this device only. It does not change the setting above.</p>
            {note ? <p className={`settings-pref-note${note.tone ? ` ${note.tone}` : ''}`}>{note.text}</p> : null}
          </div>
          {canRequest ? (
            <Button
              type="button"
              size="sm"
              variant="primary"
              onClick={requestBrowserPermission}
              disabled={pushBusy || preferencesSaving}
            >
              {pushBusy ? 'Enabling…' : 'Enable Browser Notifications'}
            </Button>
          ) : (
            <span className={`settings-permission ${status.tone}`}>{status.label}</span>
          )}
        </div>

        <div className={`settings-pref-row${pushOn ? '' : ' is-disabled'}`}>
          <div className="settings-pref-text">
            <strong id="pref-sound-label">Play Notification Sound</strong>
            <p>
              {pushOn
                ? 'Play a sound when a push notification is received. Your device may still apply its own sound or Do Not Disturb settings.'
                : 'Available when Push Notifications are on. Your previous choice is kept.'}
            </p>
          </div>
          <div className="status-switch">
            <button
              type="button"
              className={`status-switch-track${soundOn ? ' is-on' : ''}`}
              role="switch"
              aria-checked={soundOn}
              aria-labelledby="pref-sound-label"
              disabled={!pushOn || preferencesSaving}
              onClick={toggleSound}
            >
              <span className="status-switch-knob" />
            </button>
            <span className="status-switch-label">{soundOn ? 'On' : 'Off'}</span>
          </div>
        </div>
      </div>
    </Panel>
  )
}

export default function Settings() {
  const { user, updateProfile, changePassword } = useAuth()
  const notificationState = useOutletContext()
  const formKey = user?.id || user?.email || user?.mobile || 'anon'

  return (
    <>
      <PageMeta pageId="settings" title="Settings" crumb="Account and app preferences" />
      <main className="page">
        <div className="settings-grid">
          <ProfileForm key={formKey} user={user} updateProfile={updateProfile} />
          <PasswordForm changePassword={changePassword} />
          {notificationState?.eligible ? <NotificationsPanel notificationState={notificationState} /> : null}
        </div>
      </main>
    </>
  )
}
