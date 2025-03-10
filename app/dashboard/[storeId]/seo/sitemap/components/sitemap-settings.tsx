"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { seoService } from "@/lib/services/seoService"
import { updateSitemapConfig, generateSitemapXml } from "../../actions"
import { useToast } from "@/hooks/use-toast"
import { useStore } from "@/lib/hooks/useStore"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Download, RefreshCw } from "lucide-react"

const sitemapFormSchema = z.object({
  baseUrl: z.string().url("Must be a valid URL"),
  includeProducts: z.boolean().default(true),
  includePages: z.boolean().default(true),
  includeBlog: z.boolean().default(true),
  excludeUrls: z.string().optional(),
  additionalUrls: z.string().optional(),
})

export function SitemapSettings({ storeId }: { storeId: string }) {
  const { toast } = useToast()
  const { store } = useStore(storeId)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null)
  const [sitemapUrl, setSitemapUrl] = useState<string | null>(null)

  const form = useForm<z.infer<typeof sitemapFormSchema>>({
    resolver: zodResolver(sitemapFormSchema),
    defaultValues: {
      baseUrl: "",
      includeProducts: true,
      includePages: true,
      includeBlog: true,
      excludeUrls: "",
      additionalUrls: "",
    },
  })

  useEffect(() => {
    async function fetchSitemapConfig() {
      try {
        const config = await seoService.getSitemapConfig(storeId)

        if (config) {
          form.reset({
            baseUrl: config.baseUrl || "",
            includeProducts: config.includeProducts ?? true,
            includePages: config.includePages ?? true,
            includeBlog: config.includeBlog ?? true,
            excludeUrls: config.excludeUrls?.join("\n") || "",
            additionalUrls:
              config.additionalUrls
                ?.map((entry) => entry.url + (entry.priority ? ` ${entry.priority}` : ""))
                .join("\n") || "",
          })

          if (config.lastGenerated) {
            setLastGenerated(new Date(config.lastGenerated.seconds * 1000))
          }

          // Set sitemap URL
          if (config.baseUrl) {
            setSitemapUrl(`${config.baseUrl}/sitemap.xml`)
          }
        } else if (store) {
          // Set defaults based on store info
          const domain = store.customDomain || `${store.username}.nrstbuild.com`
          const baseUrl = `https://${domain}`
          form.reset({
            baseUrl,
            includeProducts: true,
            includePages: true,
            includeBlog: true,
            excludeUrls: "",
            additionalUrls: "",
          })
          setSitemapUrl(`${baseUrl}/sitemap.xml`)
        }
      } catch (error) {
        console.error("Error fetching sitemap config:", error)
        toast({
          title: "Error",
          description: "Failed to load sitemap configuration",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSitemapConfig()
  }, [storeId, form, toast, store])

  async function onSubmit(data: z.infer<typeof sitemapFormSchema>) {
    setIsSaving(true)

    try {
      // Parse excluded URLs
      const excludeUrls = data.excludeUrls
        ? data.excludeUrls
            .split("\n")
            .map((url) => url.trim())
            .filter(Boolean)
        : []

      // Parse additional URLs
      const additionalUrls = data.additionalUrls
        ? data.additionalUrls
            .split("\n")
            .map((line) => {
              const parts = line.trim().split(" ")
              const url = parts[0]
              const priority = parts.length > 1 ? Number.parseFloat(parts[1]) : undefined

              return {
                url,
                priority: priority && !isNaN(priority) ? priority : undefined,
              }
            })
            .filter((entry) => entry.url)
        : []

      const result = await updateSitemapConfig(storeId, {
        ...data,
        excludeUrls,
        additionalUrls,
      })

      if (result.success) {
        toast({
          title: "Sitemap configuration updated",
          description: "Your sitemap settings have been updated successfully",
        })
        setSitemapUrl(`${data.baseUrl}/sitemap.xml`)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update sitemap configuration",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update sitemap configuration",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleGenerateSitemap() {
    setIsGenerating(true)

    try {
      const result = await generateSitemapXml(storeId)

      if (result.success) {
        setLastGenerated(new Date())
        toast({
          title: "Sitemap generated",
          description: "Your sitemap has been generated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to generate sitemap",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate sitemap",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sitemap Settings</CardTitle>
          <CardDescription>Loading sitemap configuration...</CardDescription>
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
            <CardTitle>Sitemap Settings</CardTitle>
            <CardDescription>Configure your sitemap to help search engines discover your content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="baseUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://yourdomain.com" />
                  </FormControl>
                  <FormDescription>The base URL of your store (e.g., https://yourdomain.com)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="includeProducts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Include Products</FormLabel>
                      <FormDescription>Add product pages to sitemap</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="includePages"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Include Pages</FormLabel>
                      <FormDescription>Add custom pages to sitemap</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="includeBlog"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Include Blog</FormLabel>
                      <FormDescription>Add blog posts to sitemap</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="excludeUrls"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Excluded URLs</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="/admin\n/checkout\n/account" className="min-h-[100px]" />
                  </FormControl>
                  <FormDescription>
                    Enter one URL path per line to exclude from the sitemap (e.g., /admin)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="additionalUrls"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional URLs</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="/special-page 0.8\n/important-page 0.9"
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter one URL per line. Optionally add a priority value (0.0 to 1.0) after the URL, separated by a
                    space.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-medium">Sitemap Status</h3>
                  <p className="text-sm text-muted-foreground">
                    {lastGenerated
                      ? `Last generated: ${lastGenerated.toLocaleString()}`
                      : "Sitemap has not been generated yet"}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <Button type="button" variant="outline" onClick={handleGenerateSitemap} disabled={isGenerating}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {isGenerating ? "Generating..." : "Generate Sitemap"}
                  </Button>
                  {sitemapUrl && (
                    <Button type="button" variant="outline" asChild>
                      <a href={sitemapUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        View Sitemap
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {sitemapUrl && (
                <div className="rounded-md bg-muted p-4">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2">
                      URL
                    </Badge>
                    <code className="text-sm">{sitemapUrl}</code>
                  </div>
                </div>
              )}
            </div>
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

