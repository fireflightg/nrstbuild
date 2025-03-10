"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { integrationsService } from "@/lib/services/integrationsService"
import { createSocialMediaWidget, updateSocialMediaWidget, deleteSocialMediaWidget } from "../../actions"
import { useToast } from "@/hooks/use-toast"
import type { SocialMediaWidget } from "@/types/integrations"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { SocialMediaWidget as SocialMediaWidgetComponent } from "@/components/widgets/social-media-widget"
import { Plus, Trash, Edit, ExternalLink } from "lucide-react"

const widgetFormSchema = z.object({
  type: z.enum(["youtube", "twitch", "spotify", "instagram", "twitter", "tiktok"]),
  url: z.string().url("Please enter a valid URL"),
  title: z.string().optional(),
  width: z.string().optional(),
  height: z.string().optional(),
  autoplay: z.boolean().default(false),
  loop: z.boolean().default(false),
})

export function SocialMediaWidgets({ storeId }: { storeId: string }) {
  const { toast } = useToast()
  const [widgets, setWidgets] = useState<SocialMediaWidget[]>([])
  const [loading, setLoading] = useState(true)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [editingWidget, setEditingWidget] = useState<SocialMediaWidget | null>(null)
  const [deletingWidget, setDeletingWidget] = useState<SocialMediaWidget | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof widgetFormSchema>>({
    resolver: zodResolver(widgetFormSchema),
    defaultValues: {
      type: "youtube",
      url: "",
      title: "",
      width: "100%",
      height: "315",
      autoplay: false,
      loop: false,
    },
  })

  useEffect(() => {
    async function fetchWidgets() {
      try {
        const data = await integrationsService.getSocialMediaWidgets(storeId)
        setWidgets(data)
      } catch (error) {
        console.error("Error fetching widgets:", error)
        toast({
          title: "Error",
          description: "Failed to load social media widgets",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchWidgets()
  }, [storeId, toast])

  useEffect(() => {
    if (editingWidget) {
      form.reset({
        type: editingWidget.type,
        url: editingWidget.url,
        title: editingWidget.title || "",
        width: editingWidget.width?.toString() || "100%",
        height: editingWidget.height?.toString() || "315",
        autoplay: editingWidget.autoplay || false,
        loop: editingWidget.loop || false,
      })
    } else {
      form.reset({
        type: "youtube",
        url: "",
        title: "",
        width: "100%",
        height: "315",
        autoplay: false,
        loop: false,
      })
    }
  }, [editingWidget, form])

  async function onSubmit(data: z.infer<typeof widgetFormSchema>) {
    setIsSubmitting(true)

    try {
      if (editingWidget) {
        // Update existing widget
        const result = await updateSocialMediaWidget(storeId, editingWidget.id, data)

        if (result.success) {
          toast({
            title: "Widget updated",
            description: "The social media widget has been updated successfully",
          })

          // Update widget in state
          setWidgets((prev) =>
            prev.map((widget) =>
              widget.id === editingWidget.id ? { ...widget, ...data, updatedAt: new Date() } : widget,
            ),
          )

          setEditingWidget(null)
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update widget",
            variant: "destructive",
          })
        }
      } else {
        // Create new widget
        const result = await createSocialMediaWidget(storeId, data)

        if (result.success) {
          toast({
            title: "Widget created",
            description: "The social media widget has been created successfully",
          })

          // Add new widget to state
          const newWidget: SocialMediaWidget = {
            id: result.id!,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          setWidgets((prev) => [...prev, newWidget])
          setOpenAddDialog(false)
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create widget",
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

  async function handleDeleteWidget() {
    if (!deletingWidget) return

    try {
      const result = await deleteSocialMediaWidget(storeId, deletingWidget.id)

      if (result.success) {
        toast({
          title: "Widget deleted",
          description: "The social media widget has been deleted successfully",
        })

        // Remove widget from state
        setWidgets((prev) => prev.filter((widget) => widget.id !== deletingWidget.id))
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete widget",
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
      setDeletingWidget(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Social Media Widgets</CardTitle>
          <CardDescription>Loading widgets...</CardDescription>
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
        <h2 className="text-2xl font-bold">Social Media Widgets</h2>
        <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Widget
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Social Media Widget</DialogTitle>
              <DialogDescription>Add a new social media widget to embed in your store</DialogDescription>
            </DialogHeader>
            <WidgetForm form={form} onSubmit={onSubmit} isSubmitting={isSubmitting} buttonText="Add Widget" />
          </DialogContent>
        </Dialog>
      </div>

      {widgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="rounded-full bg-muted p-3">
              <ExternalLink className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-medium">No widgets yet</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center">
              Add your first social media widget to embed content from YouTube, Twitch, Spotify, and more.
            </p>
            <Button className="mt-4" onClick={() => setOpenAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Widget
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {widgets.map((widget) => (
            <Card key={widget.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{widget.title || getDefaultTitle(widget)}</CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => setEditingWidget(widget)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingWidget(widget)}>
                      <Trash className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
                <CardDescription>{widget.type.charAt(0).toUpperCase() + widget.type.slice(1)} Widget</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video w-full overflow-hidden rounded-md border">
                  <SocialMediaWidgetComponent widget={widget} />
                </div>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                <a
                  href={widget.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:underline"
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  View original
                </a>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Widget Dialog */}
      <Dialog open={!!editingWidget} onOpenChange={(open) => !open && setEditingWidget(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Widget</DialogTitle>
            <DialogDescription>Update your social media widget settings</DialogDescription>
          </DialogHeader>
          <WidgetForm form={form} onSubmit={onSubmit} isSubmitting={isSubmitting} buttonText="Update Widget" />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingWidget} onOpenChange={(open) => !open && setDeletingWidget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Widget</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this widget? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWidget} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function WidgetForm({
  form,
  onSubmit,
  isSubmitting,
  buttonText,
}: {
  form: any
  onSubmit: (data: any) => void
  isSubmitting: boolean
  buttonText: string
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Widget Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a widget type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="twitch">Twitch</SelectItem>
                  <SelectItem value="spotify">Spotify</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Select the type of social media content you want to embed</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://www.youtube.com/watch?v=..." />
              </FormControl>
              <FormDescription>The URL of the content you want to embed</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title (Optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="My YouTube Video" />
              </FormControl>
              <FormDescription>A title for your widget</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="width"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Width</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="100%" />
                </FormControl>
                <FormDescription>Width of the widget (e.g., 100%, 500px)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Height</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="315" />
                </FormControl>
                <FormDescription>Height of the widget (e.g., 315, 400px)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="autoplay"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Autoplay</FormLabel>
                  <FormDescription>Automatically play the content when loaded</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="loop"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Loop</FormLabel>
                  <FormDescription>Loop the content when it finishes</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : buttonText}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

function getDefaultTitle(widget: SocialMediaWidget): string {
  switch (widget.type) {
    case "youtube":
      return "YouTube Video"
    case "twitch":
      return "Twitch Stream"
    case "spotify":
      return "Spotify Player"
    case "instagram":
      return "Instagram Post"
    case "twitter":
      return "Twitter Post"
    case "tiktok":
      return "TikTok Video"
    default:
      return "Social Media Widget"
  }
}

