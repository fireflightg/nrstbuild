"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import type { EmailSettings } from "@/types/settings"
import { updateEmailSettings } from "../actions"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"

const emailFormSchema = z.object({
  notificationEmails: z.boolean(),
  marketingEmails: z.boolean(),
  orderConfirmationEmails: z.boolean(),
  shippingConfirmationEmails: z.boolean(),
  abandonedCartEmails: z.boolean(),
  emailFooter: z.string().optional(),
  emailLogo: z.string().url().optional().or(z.literal("")),
  senderName: z.string().min(1, "Sender name is required"),
  senderEmail: z.string().email("Please enter a valid email"),
})

interface EmailSettingsFormProps {
  storeId: string
  settings: EmailSettings
}

export default function EmailSettingsForm({ storeId, settings }: EmailSettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof emailFormSchema>>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      notificationEmails: settings.notificationEmails,
      marketingEmails: settings.marketingEmails,
      orderConfirmationEmails: settings.orderConfirmationEmails,
      shippingConfirmationEmails: settings.shippingConfirmationEmails,
      abandonedCartEmails: settings.abandonedCartEmails,
      emailFooter: settings.emailFooter,
      emailLogo: settings.emailLogo,
      senderName: settings.senderName,
      senderEmail: settings.senderEmail,
    },
  })

  async function onSubmit(data: z.infer<typeof emailFormSchema>) {
    setIsSubmitting(true)

    try {
      const result = await updateEmailSettings(storeId, data)

      if (result.success) {
        toast({
          title: "Settings updated",
          description: "Your email settings have been updated successfully.",
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Email Settings</h3>
        <p className="text-sm text-muted-foreground">Configure your store's email notifications and preferences.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Email Notifications</h4>

            <FormField
              control={form.control}
              name="notificationEmails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Admin Notifications</FormLabel>
                    <FormDescription>Receive notifications about store activity.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="marketingEmails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Marketing Emails</FormLabel>
                    <FormDescription>Send promotional emails to customers.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="orderConfirmationEmails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Order Confirmations</FormLabel>
                    <FormDescription>Send order confirmation emails to customers.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shippingConfirmationEmails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Shipping Confirmations</FormLabel>
                    <FormDescription>Send shipping confirmation emails to customers.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="abandonedCartEmails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Abandoned Cart Emails</FormLabel>
                    <FormDescription>Send reminders for abandoned carts.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Email Customization</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="senderName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sender Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Store Name" {...field} />
                    </FormControl>
                    <FormDescription>Name that appears in the "From" field.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="senderEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sender Email</FormLabel>
                    <FormControl>
                      <Input placeholder="noreply@example.com" {...field} />
                    </FormControl>
                    <FormDescription>Email that appears in the "From" field.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="emailLogo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Logo URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/logo.png" {...field} />
                  </FormControl>
                  <FormDescription>URL to your logo image for email headers.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emailFooter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Footer</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="© 2023 Your Store. All rights reserved."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Text to appear at the bottom of all emails.</FormDescription>
                  <FormMessage />
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

