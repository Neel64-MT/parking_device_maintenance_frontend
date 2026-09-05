import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { PageMeta } from '../context/PageMetaContext'
import { toast } from '../context/ToastContext'
import { ApiRequestError } from '../services/api'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/FilterBar'
import { Panel } from '../components/ui/Panel'
import { PasswordInput } from '../components/ui/PasswordInput'

export default function Settings() {
  const { user, updateProfile, changePassword } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (!user) return
    setName(user.name || '')
    setEmail(user.email || '')
    setMobile(user.mobile || '')
  }, [user])

  async function saveProfile(e) {
    e.preventDefault()
    const fullName = name.trim()
    const emailValue = email.trim()
    const mobileValue = mobile.trim()

    if (fullName.length < 2) {
      toast('Enter your full name.')
      return
    }
    if (!emailValue) {
      toast('Enter your email.')
      return
    }
    if (mobileValue.length < 10) {
      toast('Mobile number must be at least 10 digits.')
      return
    }

    setSavingProfile(true)
    try {
      await updateProfile({
        fullName,
        email: emailValue,
        mobile: mobileValue,
      })
      toast('Profile updated.')
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not update profile.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePassword(e) {
    e.preventDefault()
    if (!currentPassword) {
      toast('Enter your current password.')
      return
    }
    if (newPassword.length < 8) {
      toast('New password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast('New passwords do not match.')
      return
    }

    setSavingPassword(true)
    try {
      await changePassword({ currentPassword, newPassword })
      toast('Password updated.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast(err instanceof ApiRequestError ? err.message : 'Could not update password.')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <>
      <PageMeta pageId="settings" title="Settings" crumb="Account and app preferences" />
      <main className="page">
        <div className="settings-grid">
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

          <Panel
            title="Password"
            subtitle="Change the password you use to sign in"
            className="settings-panel"
          >
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
        </div>
      </main>
    </>
  )
}
