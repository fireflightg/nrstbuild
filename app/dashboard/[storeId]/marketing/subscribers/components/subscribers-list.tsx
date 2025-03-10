"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { marketingService } from "@/lib/services/marketingService"
import type { Subscriber } from "@/types/marketing"
import { createSubscriber, unsubscribe } from "../../actions"
import { useToast } from "@/hooks/use-toast"
import { usePermissions } from "@/lib/hooks/usePermissions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MoreHorizontal, Search, UserPlus, Download, Tag, XCircle } from "lucide-react"

const subscriberFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export function SubscribersList({ storeId }: { storeId: string }) {
  const { toast } = useToast()
  const { can } = usePermissions(storeId)
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const form = useForm<z.infer<typeof subscriberFormSchema>>({
    resolver: zodResolver(subscriberFormSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      tags: [],
    },
  })

  useEffect(() => {
    async function fetchSubscribers() {
      try {
        const data = await marketingService.getSubscribers(storeId)
        setSubscribers(data)
      } catch (error) {
        console.error("Error fetching subscribers:", error)
        toast({
          title: "Error",
          description: "Failed to load subscribers",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSubscribers()
  }, [storeId, toast])

  const filteredSubscribers = subscribers.filter((subscriber) => {
    const matchesSearch =
      searchTerm === "" ||
      subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (subscriber.firstName && subscriber.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (subscriber.lastName && subscriber.lastName.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesTag = !selectedTag || (subscriber.tags && subscriber.tags.includes(selectedTag))

    return matchesSearch && matchesTag
  })

  // Get unique tags from all subscribers
  const allTags = subscribers.reduce<string[]>((tags, subscriber) => {
    if (subscriber.tags) {
      subscriber.tags.forEach((tag) => {
        if (!tags.includes(tag)) {
          tags.push(tag)
        }
      })
    }
    return tags
  }, [])

  async function onSubmit(data: z.infer<typeof subscriberFormSchema>) {
    const result = await createSubscriber(storeId, data)

    if (result.success) {
      toast({
        title: "Subscriber added",
        description: "The subscriber has been added successfully",
      })

      // Add the new subscriber to the list
      const newSubscriber: Subscriber = {
        id: result.id!,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        tags: data.tags || [],
        subscribedAt: new Date(),
        status: "subscribed",
      }

      setSubscribers((prev) => [newSubscriber, ...prev])
      setOpenAddDialog(false)
      form.reset()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to add subscriber",
        variant: "destructive",
      })
    }
  }

  async function handleUnsubscribe(subscriber: Subscriber) {
    const result = await unsubscribe(storeId, subscriber.email)

    if (result.success) {
      toast({
        title: "Subscriber unsubscribed",
        description: "The subscriber has been unsubscribed successfully",
      })

      // Update the subscriber in the list
      setSubscribers((prev) =>
        prev.map((s) => (s.id === subscriber.id ? { ...s, status: "unsubscribed", unsubscribedAt: new Date() } : s)),
      )
    } else {
      toast({
        title: "Error",
        description: "Failed to unsubscribe the subscriber",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search subscribers..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {selectedTag && (
            <Badge variant="outline" className="gap-1">
              {selectedTag}
              <button
                onClick={() => setSelectedTag(null)}
                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <XCircle className="h-3 w-3 text-muted-foreground" />
                <span className="sr-only">Remove tag filter</span>
              </button>
            </Badge>
          )}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          {allTags.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Tag className="mr-2 h-4 w-4" />
                  Filter by Tag
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Select a tag</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allTags.map((tag) => (
                  <DropdownMenuItem key={tag} onClick={() => setSelectedTag(tag)}>
                    {tag}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {can("create", "marketing") && (
            <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Subscriber
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Subscriber</DialogTitle>
                  <DialogDescription>Add a new subscriber to your email list.</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email address</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="john@example.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="John" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Doe" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="tags"
                      render={() => (
                        <FormItem>
                          <FormLabel>Tags</FormLabel>
                          <div className="flex flex-wrap gap-2">
                            {["newsletter", "customer", "lead"].map((tag) => (
                              <FormField
                                key={tag}
                                control={form.control}
                                name="tags"
                                render={({ field }) => {
                                  return (
                                    <FormItem key={tag} className="flex flex-row items-start space-x-2 space-y-0">
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(tag)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...(field.value || []), tag])
                                              : field.onChange(field.value?.filter((value) => value !== tag))
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal cursor-pointer">{tag}</FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormDescription>Select tags to organize your subscribers.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="submit">Add Subscriber</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <div className="p-4 border-b">
          <div className="flex items-center">
            <Checkbox id="selectAll" className="mr-2" />
            <label htmlFor="selectAll" className="text-sm font-medium">
              Select All
            </label>

            <div className="ml-auto">
              <Button variant="outline" size="sm" className="h-8 mr-2">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading subscribers...</p>
          </div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No subscribers found.</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            {filteredSubscribers.map((subscriber) => (
              <div key={subscriber.id} className="flex items-center justify-between p-4 border-b last:border-0">
                <div className="flex items-start space-x-4">
                  <Checkbox />
                  <div>
                    <div className="font-medium">{subscriber.email}</div>
                    <div className="text-sm text-muted-foreground">
                      {subscriber.firstName && subscriber.lastName
                        ? `${subscriber.firstName} ${subscriber.lastName}`
                        : subscriber.firstName || subscriber.lastName || "No name provided"}
                    </div>

                    {subscriber.tags && subscriber.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {subscriber.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant={subscriber.status === "subscribed" ? "default" : "destructive"}>
                    {subscriber.status}
                  </Badge>

                  {can("update", "marketing") && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            /* Edit subscriber function */
                          }}
                        >
                          Edit subscriber
                        </DropdownMenuItem>
                        {subscriber.status === "subscribed" ? (
                          <DropdownMenuItem onClick={() => handleUnsubscribe(subscriber)} className="text-destructive">
                            Unsubscribe
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => {
                              /* Re-subscribe function */
                            }}
                          >
                            Re-subscribe
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </ScrollArea>
        )}
      </div>
    </div>
  )
}

