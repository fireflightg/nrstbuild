"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { seoService } from "@/lib/services/seoService"
import { updateRobotsTxtConfig, generateRobotsTxt } from "../../actions"
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

const robotsFormSchema = z.object({
  allowAll: z.boolean().default(true),
  disallowPaths: z.string().optional(),
  customRules: z.string().optional(),
  sitemapUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
})

export function RobotsTxtSettings({ storeId }: { storeId: string }) {
  const { toast } = useToast()
  const { store } = useStore(storeId)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [robotsUrl, setRobotsUrl] = useState<string | null>(null)
  const [robotsContent, setRobotsContent] = useState<string | null>(null)

  const form = useForm<z.infer<typeof robotsFormSchema>>({
    resolver: zodResolver(robotsFormSchema),
    defaultValues: {
      allowAll: true,
      disallowPaths: "",
      customRules: "",
      sitemapUrl: "",
    },
  })

  useEffect(() => {
    async function fetchRobotsTxtConfig() {
      try {
        const config = await seoService.getRobotsTxtConfig(storeId)

        if (config) {
          form.reset({
            allowAll: config.allowAll ?? true,
            disallowPaths: config.disallowPaths?.join("\n") || "",
            customRules: config.customRules?.join("\n") || "",
            sitemapUrl: config.sitemapUrl || "",
          })

          if (config.lastUpdated) {
            setLastUpdated(new Date(config.lastUpdated.seconds * 1000))
          }

          // Set robots.txt URL
          if (store?.customDomain) {
            setRobotsUrl(`https://${store.customDomain}/robots.txt`)
          } else if (store?.username) {
            setRobotsUrl(`https://${store.username}.nrstbuild.com/robots.txt`)
          }
        } else if (store) {
          // Set defaults based on store info
          const domain = store.customDomain || `${store.username}.nrstbuild.com`
          const baseUrl = `https://${domain}`
          form.reset({
            allowAll: true,
            disallowPaths: "/admin\n/checkout\n/account",
            customRules: "",
            sitemapUrl: `${baseUrl}/sitemap.xml`,
          })
          setRobotsUrl(`${baseUrl}/robots.txt`)
        }
      } catch (error) {
        console.error("Error fetching robots.txt config:", error)
        toast({
          title: "Error",
          description: "Failed to load robots.txt configuration",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRobotsTxtConfig()
  }, [storeId, form, toast, store])

  async function onSubmit(data: z.infer<typeof robotsFormSchema>) {
    setIsSaving(true)

    try {
      // Parse disallow paths
      const disallowPaths = data.disallowPaths
        ? data.disallowPaths
            .split("\n")
            .map((path) => path.trim())
            .filter(Boolean)
        : []

      // Parse custom rules
      const customRules = data.customRules
        ? data.customRules
            .split("\n")
            .map((rule) => rule.trim())
            .filter(Boolean)
        : []

      const result = await updateRobotsTxtConfig(storeId, {
        allowAll: data.allowAll,
        disallowPaths,
        customRules,
        sitemapUrl: data.sitemapUrl || undefined,
      })

      if (result.success) {
        toast({
          title: "Robots.txt configuration updated",
          description: "Your robots.txt settings have been updated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update robots.txt configuration",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update robots.txt configuration",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function handleGenerateRobotsTxt() {
    setIsGenerating(true)

    try {
      const result = await generateRobotsTxt(storeId)

      if (result.success) {
        setLastUpdated(new Date())
        setRobotsContent(result.content)
        toast({
          title: "Robots.txt generated",
          description: "Your robots.txt file has been generated successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to generate robots.txt",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate robots.txt",
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
          <CardTitle>Robots.txt Settings</CardTitle>
          <CardDescription>Loading robots.txt configuration...</CardDescription>
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
            <CardTitle>Robots.txt Settings</CardTitle>
            <CardDescription>
              Configure your robots.txt file to control how search engines crawl your site
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="allowAll"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Allow All Crawling</FormLabel>
                    <FormDescription>
                      Allow search engines to crawl your entire site (recommended for most sites)
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="disallowPaths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disallowed Paths</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="/admin\n/checkout\n/account"
                      className="min-h-[100px]"
                      disabled={form.watch("allowAll")}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter one path per line to disallow search engines from crawling (e.g., /admin)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sitemapUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sitemap URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://yourdomain.com/sitemap.xml" />
                  </FormControl>
                  <FormDescription>
                    The URL to your sitemap.xml file (leave empty to exclude from robots.txt)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customRules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Rules</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="User-agent: Googlebot\nDisallow: /nogooglebot/\n\nUser-agent: *\nAllow: /public/"
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormDescription>Enter custom rules for your robots.txt file (one rule per line)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-medium">Robots.txt Status</h3>
                  <p className="text-sm text-muted-foreground">
                    {lastUpdated
                      ? `Last updated: ${lastUpdated.toLocaleString()}`
                      : "Robots.txt has not been generated yet"}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <Button type="button" variant="outline" onClick={handleGenerateRobotsTxt} disabled={isGenerating}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {isGenerating ? "Generating..." : "Generate Robots.txt"}
                  </Button>
                  {robotsUrl && (
                    <Button type="button" variant="outline" asChild>
                      <a href={robotsUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="mr-2 h-4 w-4" />
                        View Robots.txt
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {robotsUrl && (
                <div className="rounded-md bg-muted p-4">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2">
                      URL
                    </Badge>
                    <code className="text-sm">{robotsUrl}</code>
                  </div>
                </div>
              )}

              {robotsContent && (
                <div className="rounded-md border p-4 mt-4">
                  <h4 className="text-sm font-medium mb-2">Preview:</h4>
                  <pre className="text-xs overflow-auto whitespace-pre bg-muted p-2 rounded-md">{robotsContent}</pre>
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

