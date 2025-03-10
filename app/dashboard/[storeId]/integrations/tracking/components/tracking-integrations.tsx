"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { integrationsService } from "@/lib/services/integrationsService"
import {
  createTrackingIntegration,
  updateTrackingIntegration,
  toggleTrackingIntegration,
  deleteTrackingIntegration,
} from "../../actions"
import { useToast } from "@/hooks/use-toast"
import type { TrackingIntegration } from "@/types/integrations"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Trash, Edit, ExternalLink, BarChart } from "lucide-react"

const trackingFormSchema = z.object({
  type: z.enum(["google_analytics", "facebook_pixel", "google_tag_manager", "hotjar", "tiktok_pixel"]),
  trackingId: z.string().min(1, "Tracking ID is required"),
  enabled: z.boolean().default(true),
})

export function TrackingIntegrations({ storeId }: { storeId: string }) {
  const { toast } = useToast()
  const [integrations, setIntegrations] = useState<TrackingIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [editingIntegration, setEditingIntegration] = useState<TrackingIntegration | null>(null)
  const [deletingIntegration, setDeletingIntegration] = useState<TrackingIntegration | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof trackingFormSchema>>({
    resolver: zodResolver(trackingFormSchema),
    defaultValues: {
      type: "google_analytics",
      trackingId: "",
      enabled: true,
    },
  })

  useEffect(() => {
    async function fetchIntegrations() {
      try {
        const data = await integrationsService.getTrackingIntegrations(storeId)
        setIntegrations(data)
      } catch (error) {
        console.error("Error fetching tracking integrations:", error)
        toast({
          title: "Error",
          description: "Failed to load tracking integrations",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchIntegrations()
  }, [storeId, toast])

  useEffect(() => {
    if (editingIntegration) {
      form.reset({
        type: editingIntegration.type,
        trackingId: editingIntegration.trackingId,
        enabled: editingIntegration.enabled,
      })
    } else {
      form.reset({
        type: "google_analytics",
        trackingId: "",
        enabled: true,
      })
    }
  }, [editingIntegration, form])

  async function onSubmit(data: z.infer<typeof trackingFormSchema>) {
    setIsSubmitting(true)

    try {
      if (editingIntegration) {
        // Update existing integration
        const result = await updateTrackingIntegration(storeId, editingIntegration.id, data)

        if (result.success) {
          toast({
            title: "Integration updated",
            description: "The tracking integration has been updated successfully",
          })

          // Update integration in state
          setIntegrations((prev) =>
            prev.map((integration) =>
              integration.id === editingIntegration.id
                ? { ...integration, ...data, updatedAt: new Date() }
                : integration,
            ),
          )

          setEditingIntegration(null)
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update integration",
            variant: "destructive",
          })
        }
      } else {
        // Create new integration
        const result = await createTrackingIntegration(storeId, data)

        if (result.success) {
          toast({
            title: "Integration created",
            description: "The tracking integration has been created successfully",
          })

          // Add new integration to state or update existing one
          const existingIndex = integrations.findIndex((i) => i.type === data.type)

          if (existingIndex >= 0) {
            // Update existing integration
            setIntegrations((prev) =>
              prev.map((integration, index) =>
                index === existingIndex ? { ...integration, ...data, updatedAt: new Date() } : integration,
              ),
            )
          } else {
            // Add new integration
            const newIntegration: TrackingIntegration = {
              id: result.id!,
              storeId,
              ...data,
              createdAt: new Date(),
              updatedAt: new Date(),
            }

            setIntegrations((prev) => [...prev, newIntegration])
          }

          setOpenAddDialog(false)
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create integration",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleIntegration(integration: TrackingIntegration) {
    try {
      const result = await toggleTrackingIntegration(storeId, integration.id, !integration.enabled)

      if (result.success) {
        toast({
          title: integration.enabled ? "Integration disabled" : "Integration enabled",
          description: `The tracking integration has been ${integration.enabled ? "disabled" : "enabled"} successfully`,
        })

        // Update integration in state
        setIntegrations((prev) =>
          prev.map((i) => (i.id === integration.id ? { ...i, enabled: !i.enabled, updatedAt: new Date() } : i)),
        )
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update integration",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  async function handleDeleteIntegration() {
    if (!deletingIntegration) return

    try {
      const result = await deleteTrackingIntegration(storeId, deletingIntegration.id)

      if (result.success) {
        toast({
          title: "Integration deleted",
          description: "The tracking integration has been deleted successfully",
        })

        // Remove integration from state
        setIntegrations((prev) => prev.filter((i) => i.id !== deletingIntegration.id))
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete integration",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setDeletingIntegration(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tracking Integrations</CardTitle>
          <CardDescription>Loading integrations...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tracking & Analytics</h2>
        <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Tracking Integration</DialogTitle>
              <DialogDescription>Add a new tracking or analytics integration to your store</DialogDescription>
            </DialogHeader>
            <TrackingForm form={form} onSubmit={onSubmit} isSubmitting={isSubmitting} buttonText="Add Integration" />
          </DialogContent>
        </Dialog>
      </div>

      {integrations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-muted p-3">
              <BarChart className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-medium">No tracking integrations yet</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center">
              Add your first tracking integration to monitor your store's performance.
            </p>
            <Button className="mt-4" onClick={() => setOpenAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Integration
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>{getIntegrationTitle(integration.type)}</CardTitle>
                  <div className="flex space-x-2">
                    <Switch
                      checked={integration.enabled}
                      onCheckedChange={() => handleToggleIntegration(integration)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => setEditingIntegration(integration)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingIntegration(integration)}>
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
                <CardDescription>{getIntegrationDescription(integration.type)}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Tracking ID</p>
                    <p className="text-sm text-muted-foreground font-mono">{integration.trackingId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className={`text-sm ${integration.enabled ? "text-green-500" : "text-red-500"}`}>
                      {integration.enabled ? "Active" : "Disabled"}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                <a
                  href={getIntegrationLink(integration.type)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:underline"
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  View documentation
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Integration Dialog */}
      <Dialog open={!!editingIntegration} onOpenChange={(open) => !open && setEditingIntegration(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Integration</DialogTitle>
            <DialogDescription>Update your tracking integration settings</DialogDescription>
          </DialogHeader>
          <TrackingForm
            form={form}
            onSubmit={onSubmit}
            isSubmitting={isSubmitting}
            buttonText="Update Integration"
            disableTypeChange={true}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingIntegration} onOpenChange={(open) => !open && setDeletingIntegration(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Integration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tracking integration? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteIntegration} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function TrackingForm({
  form,
  onSubmit,
  isSubmitting,
  buttonText,
  disableTypeChange = false,
}: {
  form: any
  onSubmit: (data: any) => void
  isSubmitting: boolean
  buttonText: string
  disableTypeChange?: boolean
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Integration Type</FormLabel>
              <FormControl>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                  disabled={disableTypeChange}
                >
                  <option value="google_analytics">Google Analytics</option>
                  <option value="facebook_pixel">Facebook Pixel</option>
                  <option value="google_tag_manager">Google Tag Manager</option>
                  <option value="hotjar">Hotjar</option>
                  <option value="tiktok_pixel">TikTok Pixel</option>
                </select>
              </FormControl>
              <FormDescription>Select the type of tracking integration</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="trackingId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tracking ID</FormLabel>
              <FormControl>
                <Input {...field} placeholder={getTrackingIdPlaceholder(form.watch("type"))} />
              </FormControl>
              <FormDescription>{getTrackingIdDescription(form.watch("type"))}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Enabled</FormLabel>
                <FormDescription>Enable or disable this tracking integration</FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : buttonText}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

function getIntegrationTitle(type: TrackingIntegration["type"]): string {
  switch (type) {
    case "google_analytics":
      return "Google Analytics"
    case "facebook_pixel":
      return "Facebook Pixel"
    case "google_tag_manager":
      return "Google Tag Manager"
    case "hotjar":
      return "Hotjar"
    case "tiktok_pixel":
      return "TikTok Pixel"
    default:
      return "Tracking Integration"
  }
}

function getIntegrationDescription(type: TrackingIntegration["type"]): string {
  switch (type) {
    case "google_analytics":
      return "Track website traffic and user behavior"
    case "facebook_pixel":
      return "Track conversions and optimize Facebook ads"
    case "google_tag_manager":
      return "Manage all your tracking tags in one place"
    case "hotjar":
      return "Visualize user behavior with heatmaps and recordings"
    case "tiktok_pixel":
      return "Track conversions and optimize TikTok ads"
    default:
      return "Track and analyze user behavior"
  }
}

function getIntegrationLink(type: TrackingIntegration["type"]): string {
  switch (type) {
    case "google_analytics":
      return "https://support.google.com/analytics/answer/9304153"
    case "facebook_pixel":
      return "https://www.facebook.com/business/help/952192354843755"
    case "google_tag_manager":
      return "https://support.google.com/tagmanager/answer/6102821"
    case "hotjar":
      return "https://help.hotjar.com/hc/en-us/articles/115009336727"
    case "tiktok_pixel":
      return "https://ads.tiktok.com/help/article?aid=10028"
    default:
      return "#"
  }
}

function getTrackingIdPlaceholder(type: TrackingIntegration["type"]): string {
  switch (type) {
    case "google_analytics":
      return "G-XXXXXXXXXX"
    case "facebook_pixel":
      return "XXXXXXXXXXXXXXXXXX"
    case "google_tag_manager":
      return "GTM-XXXXXX"
    case "hotjar":
      return "XXXXXXX"
    case "tiktok_pixel":
      return "XXXXXXXXXXXXXXXXXX"
    default:
      return ""
  }
}

function getTrackingIdDescription(type: TrackingIntegration["type"]): string {
  switch (type) {
    case "google_analytics":
      return "Your Google Analytics 4 Measurement ID (starts with G-)"
    case "facebook_pixel":
      return "Your Facebook Pixel ID"
    case "google_tag_manager":
      return "Your Google Tag Manager Container ID (starts with GTM-)"
    case "hotjar":
      return "Your Hotjar Site ID"
    case "tiktok_pixel":
      return "Your TikTok Pixel ID"
    default:
      return "Your tracking ID"
  }
}

