"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { updatePageSeoSettings } from "@/app/dashboard/[storeId]/seo/actions"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { SocialPreview } from "@/app/dashboard/[storeId]/seo/store/components/social-preview"
import type { SeoSettings } from "@/types/seo"

const pageSeoFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(60, "Title should be less than 60 characters"),
  description: z.string().max(160, "Description should be less than 160 characters"),
  keywords: z.string().optional(),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  noindex: z.boolean().default(false),
  nofollow: z.boolean().default(false),
})

interface PageSeoFormProps {
  storeId: string
  pageId: string
  pagePath: string
  initialData?: Partial<SeoSettings>
  defaultTitle?: string
  defaultDescription?: string
  defaultImage?: string
  storeDomain?: string
}

export function PageSeoForm({
  storeId,
  pageId,
  pagePath,
  initialData,
  defaultTitle = "",
  defaultDescription = "",
  defaultImage = "",
  storeDomain = "",
}: PageSeoFormProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  const form = useForm<z.infer<typeof pageSeoFormSchema>>({
    resolver: zodResolver(pageSeoFormSchema),
    defaultValues: {
      title: initialData?.title || defaultTitle,
      description: initialData?.description || defaultDescription,
      keywords: initialData?.keywords?.join(", ") || "",
      ogTitle: initialData?.ogTitle || "",
      ogDescription: initialData?.ogDescription || "",
      ogImage: initialData?.ogImage || defaultImage,
      noindex: initialData?.noindex || false,
      nofollow: initialData?.nofollow || false,
    },
  })

  async function onSubmit(data: z.infer<typeof pageSeoFormSchema>) {
    setIsSaving(true)

    try {
      // Convert comma-separated keywords to array
      const keywords = data.keywords ? data.keywords.split(",").map((keyword) => keyword.trim()) : []

      const result = await updatePageSeoSettings(storeId, pageId, {
        ...data,
        keywords,
        pagePath,
      })

      if (result.success) {
        toast({
          title: "SEO settings updated",
          description: "Page SEO settings have been updated successfully",
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Page SEO Settings</CardTitle>
            <CardDescription>Optimize this page for search engines and social media sharing</CardDescription>
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
                        <Input {...field} placeholder="Page Title" />
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
                          placeholder="A brief description of this page"
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
                        <Input {...field} placeholder="keyword1, keyword2, keyword3" />
                      </FormControl>
                      <FormDescription>
                        Comma-separated keywords related to this page (less important for modern SEO)
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
                          <Input {...field} placeholder={form.watch("title") || "Page Title"} />
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
                            placeholder={form.watch("description") || "A brief description of this page"}
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

                <SocialPreview
                  title={form.watch("ogTitle") || form.watch("title") || "Page Title"}
                  description={
                    form.watch("ogDescription") || form.watch("description") || "A brief description of this page"
                  }
                  image={form.watch("ogImage")}
                  url={`${storeDomain}${pagePath}`}
                />
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="noindex"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>No Index</FormLabel>
                          <FormDescription>Prevent search engines from indexing this page</FormDescription>
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
                          <FormDescription>Prevent search engines from following links on this page</FormDescription>
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
              {isSaving ? "Saving..." : "Save SEO Settings"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}

