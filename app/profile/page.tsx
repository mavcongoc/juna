"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Loader2, Mail, UserIcon, Save, AlertCircle, CheckCircle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import UserStats from "@/components/user-stats"
import { getSupabaseClient } from "@/lib/supabase-client"

interface UserProfile {
  display_name: string
  bio: string
  timezone: string
  notification_preferences: {
    email_journal_reminders: boolean
    email_insights: boolean
    email_tips: boolean
  }
}

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<UserProfile>({
    display_name: "",
    bio: "",
    timezone: "UTC",
    notification_preferences: {
      email_journal_reminders: true,
      email_insights: true,
      email_tips: true,
    },
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const router = useRouter()
  const supabase = getSupabaseClient()

  useEffect(() => {
    // If user is not logged in, redirect to sign in page
    if (!user) {
      router.push("/auth/signin?redirectedFrom=/profile")
      return
    }

    // Fetch user profile data
    const fetchProfile = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).single()

        if (error) {
          console.error("Error fetching profile:", error)
          // If no profile exists yet, we'll use the default values
        } else if (data) {
          setProfile({
            display_name: data.display_name || user.user_metadata?.name || "",
            bio: data.bio || "",
            timezone: data.timezone || "UTC",
            notification_preferences: data.notification_preferences || {
              email_journal_reminders: true,
              email_insights: true,
              email_tips: true,
            },
          })
        }
      } catch (err) {
        console.error("Unexpected error fetching profile:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [user, router, supabase])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveSuccess(false)
    setSaveError(null)

    try {
      if (!user) return

      const { error } = await supabase.from("user_profiles").upsert({
        user_id: user.id,
        display_name: profile.display_name,
        bio: profile.bio,
        timezone: profile.timezone,
        notification_preferences: profile.notification_preferences,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      // Update user metadata with display name
      await supabase.auth.updateUser({
        data: { name: profile.display_name },
      })

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error: any) {
      console.error("Error updating profile:", error)
      setSaveError(error.message || "Failed to update profile. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingPassword(true)
    setPasswordSuccess(false)
    setPasswordError(null)

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match")
      setIsUpdatingPassword(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      setPasswordSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (error: any) {
      console.error("Error updating password:", error)
      setPasswordError(error.message || "Failed to update password. Please try again.")
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-light mb-2">Your Profile</h1>
      <p className="text-muted-foreground mb-6">Manage your account settings and preferences</p>

      <div className="mb-8">
        <h2 className="text-xl font-light mb-4">Journal Statistics</h2>
        <UserStats />
      </div>

      <Separator className="my-8" />

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" /> Email
                  </Label>
                  <Input id="email" type="email" value={user?.email || ""} disabled />
                  <p className="text-xs text-muted-foreground">Contact support to change your email address</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_name" className="flex items-center">
                    <UserIcon className="h-4 w-4 mr-2" /> Display Name
                  </Label>
                  <Input
                    id="display_name"
                    value={profile.display_name}
                    onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                    placeholder="Your display name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="Tell us a little about yourself"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={profile.timezone}
                    onValueChange={(value) => setProfile({ ...profile, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC (Coordinated Universal Time)</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (US & Canada)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (US & Canada)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (US & Canada)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (US & Canada)</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {saveSuccess && (
                  <Alert
                    variant="success"
                    className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>Profile updated successfully!</AlertDescription>
                  </Alert>
                )}

                {saveError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{saveError}</AlertDescription>
                  </Alert>
                )}
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleSignOut} className="text-destructive">
                Sign Out
              </Button>
              <Button
                type="submit"
                onClick={handleUpdateProfile}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how and when we contact you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="journal_reminders">Journal Reminders</Label>
                    <p className="text-sm text-muted-foreground">Receive reminders to write in your journal</p>
                  </div>
                  <Switch
                    id="journal_reminders"
                    checked={profile.notification_preferences.email_journal_reminders}
                    onCheckedChange={(checked) =>
                      setProfile({
                        ...profile,
                        notification_preferences: {
                          ...profile.notification_preferences,
                          email_journal_reminders: checked,
                        },
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="insights_notifications">Insights Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get notified when new insights are available</p>
                  </div>
                  <Switch
                    id="insights_notifications"
                    checked={profile.notification_preferences.email_insights}
                    onCheckedChange={(checked) =>
                      setProfile({
                        ...profile,
                        notification_preferences: {
                          ...profile.notification_preferences,
                          email_insights: checked,
                        },
                      })
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="tips_notifications">Tips & Techniques</Label>
                    <p className="text-sm text-muted-foreground">Receive helpful mental health tips and techniques</p>
                  </div>
                  <Switch
                    id="tips_notifications"
                    checked={profile.notification_preferences.email_tips}
                    onCheckedChange={(checked) =>
                      setProfile({
                        ...profile,
                        notification_preferences: {
                          ...profile.notification_preferences,
                          email_tips: checked,
                        },
                      })
                    }
                  />
                </div>
              </div>

              {saveSuccess && (
                <Alert
                  variant="success"
                  className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                >
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>Preferences updated successfully!</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleUpdateProfile} disabled={isSaving} className="flex items-center gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isSaving ? "Saving..." : "Save Preferences"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Update your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current_password">Current Password</Label>
                  <Input
                    id="current_password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password">Confirm New Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                {passwordSuccess && (
                  <Alert
                    variant="success"
                    className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>Password updated successfully!</AlertDescription>
                  </Alert>
                )}

                {passwordError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{passwordError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmPassword}
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
