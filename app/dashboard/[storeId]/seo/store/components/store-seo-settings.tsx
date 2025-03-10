"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { seoService } from "@/lib/services/seoService"
import { updateStoreSeoSettings } from "../../actions"
import { useToast } from "@/hooks/use-toast"
import { useStore } from "@/lib/hooks/useStore"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { SocialPreview } from "./social-preview"

const seoFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(60, "Title should be less than 60 characters"),
  description: z.string().max(160, "Description should be less than 160 characters"),
  keywords: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  twitterCreator: z.string().optional(),
  canonicalUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  noindex: z.boolean().default(false),
  nofollow: z.boolean().default(false),
})

export function StoreSeoSettings({ storeId }: { storeId: string }) {
  const { toast } = useToast()
  const { store } = useStore(storeId)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  const form = useForm<z.infer<typeof seoFormSchema>>({
    resolver: zodResolver(seoFormSchema),
    defaultValues: {
      title: "",
      description: "",
      keywords: "",
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      twitterTitle: "",
      twitterDescription: "",
      twitterImage: "",
      twitterCreator: "",
      canonicalUrl: "",
      noindex: false,
      nofollow: false,
    },
  })

  useEffect(() => {
    async function fetchSeoSettings() {
      try {
        const seoSettings = await seoService.getStoreSeoSettings(storeId)

        if (seoSettings) {
          form.reset({
            title: seoSettings.title || "",
            description: seoSettings.description || "",
            keywords: seoSettings.keywords?.join(", ") || "",
            ogTitle: seoSettings.ogTitle || "",
            ogDescription: seoSettings.ogDescription || "",
            ogImage: seoSettings.ogImage || "",
            twitterTitle: seoSettings.twitterTitle || "",
            twitterDescription: seoSettings.twitterDescription || "",
            twitterImage: seoSettings.twitterImage || "",
            twitterCreator: seoSettings.twitterCreator || "",
            canonicalUrl: seoSettings.canonicalUrl || "",
            noindex: seoSettings.noindex || false,
            nofollow: seoSettings.nofollow || false,
          })
        } else if (store) {
          // Set defaults based on store info
          form.reset({
            title: store.name || "",
            description: store.description || "",
            keywords: "",
            ogTitle: "",
            ogDescription: "",
            ogImage: "",
            twitterTitle: "",
            twitterDescription: "",
            twitterImage: "",
            twitterCreator: "",
            canonicalUrl: "",
            noindex: false,
            nofollow: false,
          })
        }
      } catch (error) {
        console.error("Error fetching SEO settings:", error)
        toast({
          title: "Error",
          description: "Failed to load SEO settings",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSeoSettings()
  }, [storeId, form, toast, store])

  async function onSubmit(data: z.infer<typeof seoFormSchema>) {
    setIsSaving(true)

    try {
      // Convert comma-separated keywords to array
      const keywords = data.keywords ? data.keywords.split(",").map((keyword) => keyword.trim()) : []

      const result = await updateStoreSeoSettings(storeId, {
        ...data,
        keywords,
      })

      if (result.success) {
        toast({
          title: "SEO settings updated",
          description: "Your store SEO settings have been updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update SEO settings",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update SEO settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Store SEO Settings</CardTitle>
          <CardDescription>Loading SEO settings...</CardDescription>
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Store SEO Settings</CardTitle>
            <CardDescription>Optimize your store for search engines and social media sharing</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="social">Social Media</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Your Store Name" />
                      </FormControl>
                      <FormDescription>
                        The title that appears in search engine results (recommended: 50-60 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="A brief description of your store"
                          className="resize-none"
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        A short description that appears in search results (recommended: 120-160 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keywords</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="online store, products, services" />
                      </FormControl>
                      <FormDescription>
                        Comma-separated keywords related to your store (less important for modern SEO)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="social" className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Open Graph (Facebook, LinkedIn)</h3>

                  <FormField
                    control={form.control}
                    name="ogTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OG Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={form.watch("title") || "Your Store Name"} />
                        </FormControl>
                        <FormDescription>
                          Title used when sharing on Facebook and other platforms (leave empty to use page title)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ogDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OG Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={form.watch("description") || "A brief description of your store"}
                            className="resize-none"
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          Description used when sharing on Facebook (leave empty to use meta description)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ogImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>OG Image URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com/image.jpg" />
                        </FormControl>
                        <FormDescription>
                          Image displayed when sharing on Facebook (recommended size: 1200x630 pixels)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Twitter Card</h3>

                  <FormField
                    control={form.control}
                    name="twitterTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter Title</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={form.watch("ogTitle") || form.watch("title") || "Your Store Name"}
                          />
                        </FormControl>
                        <FormDescription>
                          Title used when sharing on Twitter (leave empty to use OG title)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twitterDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter Description</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder={
                              form.watch("ogDescription") ||
                              form.watch("description") ||
                              "A brief description of your store"
                            }
                            className="resize-none"
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          Description used when sharing on Twitter (leave empty to use OG description)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twitterImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter Image URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder={form.watch("ogImage") || "https://example.com/image.jpg"} />
                        </FormControl>
                        <FormDescription>
                          Image displayed when sharing on Twitter (leave empty to use OG image)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twitterCreator"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Twitter Creator</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="@yourusername" />
                        </FormControl>
                        <FormDescription>Your Twitter username (e.g., @yourusername)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <SocialPreview
                  title={form.watch("ogTitle") || form.watch("title") || "Your Store Name"}
                  description={
                    form.watch("ogDescription") || form.watch("description") || "A brief description of your store"
                  }
                  image={form.watch("ogImage")}
                  url={store?.customDomain || `${store?.username}.nrstbuild.com`}
                />
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <FormField
                  control={form.control}
                  name="canonicalUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Canonical URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://yourdomain.com" />
                      </FormControl>
                      <FormDescription>
                        The preferred URL for your store (useful for avoiding duplicate content issues)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="noindex"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>No Index</FormLabel>
                          <FormDescription>Prevent search engines from indexing your store</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nofollow"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>No Follow</FormLabel>
                          <FormDescription>Prevent search engines from following links on your store</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}

