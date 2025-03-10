"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import type { SecuritySettings } from "@/types/settings"
import { updateSecuritySettings } from "../actions"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { toast } from "@/components/ui/use-toast"

const securityFormSchema = z.object({
  twoFactorAuth: z.boolean(),
  passwordResetRequired: z.boolean(),
  sessionTimeout: z.number().min(5).max(1440),
  ipRestrictions: z.array(z.string()),
  allowedLoginAttempts: z.number().min(1).max(10),
  passwordMinLength: z.number().min(6).max(30),
  passwordRequireSpecialChar: z.boolean(),
  passwordRequireNumber: z.boolean(),
  passwordRequireUppercase: z.boolean(),
})

interface SecuritySettingsFormProps {
  storeId: string
  settings: SecuritySettings
}

export default function SecuritySettingsForm({ storeId, settings }: SecuritySettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ipInput, setIpInput] = useState("")

  const form = useForm<z.infer<typeof securityFormSchema>>({
    resolver: zodResolver(securityFormSchema),
    defaultValues: {
      twoFactorAuth: settings.twoFactorAuth,
      passwordResetRequired: settings.passwordResetRequired,
      sessionTimeout: settings.sessionTimeout,
      ipRestrictions: settings.ipRestrictions,
      allowedLoginAttempts: settings.allowedLoginAttempts,
      passwordMinLength: settings.passwordMinLength,
      passwordRequireSpecialChar: settings.passwordRequireSpecialChar,
      passwordRequireNumber: settings.passwordRequireNumber,
      passwordRequireUppercase: settings.passwordRequireUppercase,
    },
  })

  async function onSubmit(data: z.infer<typeof securityFormSchema>) {
    setIsSubmitting(true)

    try {
      const result = await updateSecuritySettings(storeId, data)

      if (result.success) {
        toast({
          title: "Settings updated",
          description: "Your security settings have been updated successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update settings. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const addIpRestriction = () => {
    if (!ipInput) return

    // Simple IP validation
    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/
    if (!ipRegex.test(ipInput)) {
      toast({
        title: "Invalid IP",
        description: "Please enter a valid IP address.",
        variant: "destructive",
      })
      return
    }

    const currentIps = form.getValues("ipRestrictions")
    if (currentIps.includes(ipInput)) {
      toast({
        title: "Duplicate IP",
        description: "This IP address is already in the list.",
        variant: "destructive",
      })
      return
    }

    form.setValue("ipRestrictions", [...currentIps, ipInput])
    setIpInput("")
  }

  const removeIpRestriction = (ip: string) => {
    const currentIps = form.getValues("ipRestrictions")
    form.setValue(
      "ipRestrictions",
      currentIps.filter((i) => i !== ip),
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Security Settings</h3>
        <p className="text-sm text-muted-foreground">Configure your store's security preferences.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Authentication</h4>

            <FormField
              control={form.control}
              name="twoFactorAuth"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Two-Factor Authentication</FormLabel>
                    <FormDescription>Require two-factor authentication for all team members.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passwordResetRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Require Password Reset</FormLabel>
                    <FormDescription>Force team members to reset their password on next login.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sessionTimeout"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Timeout (minutes)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        min={5}
                        max={1440}
                        step={5}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>5 min</span>
                        <span>{field.value} min</span>
                        <span>24 hours</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>Automatically log out users after this period of inactivity.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">IP Restrictions</h4>

            <FormField
              control={form.control}
              name="ipRestrictions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allowed IP Addresses</FormLabel>
                  <FormDescription>
                    Restrict admin access to specific IP addresses. Leave empty to allow all IPs.
                  </FormDescription>

                  <div className="flex gap-2 mb-2">
                    <Input placeholder="192.168.1.1" value={ipInput} onChange={(e) => setIpInput(e.target.value)} />
                    <Button type="button" onClick={addIpRestriction} variant="outline">
                      Add
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {field.value.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No IP restrictions set.</p>
                    ) : (
                      field.value.map((ip) => (
                        <div key={ip} className="flex items-center justify-between rounded-md border px-3 py-2">
                          <span>{ip}</span>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeIpRestriction(ip)}>
                            Remove
                          </Button>
                        </div>
                      ))
                    )}
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Login Security</h4>

            <FormField
              control={form.control}
              name="allowedLoginAttempts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allowed Login Attempts</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      {...field}
                      onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Number of failed login attempts before account lockout.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Password Requirements</h4>

            <FormField
              control={form.control}
              name="passwordMinLength"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Password Length</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={6}
                      max={30}
                      {...field}
                      onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Minimum number of characters required for passwords.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passwordRequireUppercase"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Require Uppercase Letter</FormLabel>
                    <FormDescription>Passwords must contain at least one uppercase letter.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passwordRequireNumber"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Require Number</FormLabel>
                    <FormDescription>Passwords must contain at least one number.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passwordRequireSpecialChar"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Require Special Character</FormLabel>
                    <FormDescription>Passwords must contain at least one special character.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Form>
    </div>
  )
}

