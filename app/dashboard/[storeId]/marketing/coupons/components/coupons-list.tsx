"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { marketingService } from "@/lib/services/marketingService"
import type { Coupon } from "@/types/marketing"
import { createCoupon, updateCoupon } from "../../actions"
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
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CalendarIcon, Ticket, Search, MoreHorizontal, Plus } from "lucide-react"
import { format } from "date-fns"

const couponFormSchema = z.object({
  code: z.string().min(3, "Code must be at least 3 characters"),
  type: z.enum(["percentage", "fixed", "free_shipping"]),
  value: z.coerce.number().min(0, "Value must be greater than 0"),
  minPurchase: z.coerce.number().min(0).optional(),
  maxDiscount: z.coerce.number().min(0).optional(),
  startDate: z.date(),
  endDate: z.date().optional(),
  usageLimit: z.coerce.number().min(0).optional(),
  oneTimeUse: z.boolean().default(false),
})

export function CouponsList({ storeId }: { storeId: string }) {
  const { toast } = useToast()
  const { can } = usePermissions(storeId)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("active")

  const form = useForm<z.infer<typeof couponFormSchema>>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: "",
      type: "percentage",
      value: 10,
      minPurchase: 0,
      maxDiscount: undefined,
      startDate: new Date(),
      endDate: undefined,
      usageLimit: undefined,
      oneTimeUse: false,
    },
  })

  useEffect(() => {
    async function fetchCoupons() {
      try {
        const data = await marketingService.getCoupons(storeId)
        setCoupons(data)
      } catch (error) {
        console.error("Error fetching coupons:", error)
        toast({
          title: "Error",
          description: "Failed to load coupons",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCoupons()
  }, [storeId, toast])

  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch = searchTerm === "" || coupon.code.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = activeTab === "all" || coupon.status === activeTab

    return matchesSearch && matchesStatus
  })

  async function onSubmit(data: z.infer<typeof couponFormSchema>) {
    const result = await createCoupon(storeId, {
      ...data,
      customerEmails: [],
      products: [],
      excludedProducts: [],
    })

    if (result.success) {
      toast({
        title: "Coupon created",
        description: "The coupon has been created successfully",
      })

      // Add the new coupon to the list
      const newCoupon: Coupon = {
        id: result.id!,
        code: data.code.toUpperCase(),
        type: data.type,
        value: data.value,
        minPurchase: data.minPurchase,
        maxDiscount: data.maxDiscount,
        startDate: data.startDate,
        endDate: data.endDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "",
        status: "active",
        usageLimit: data.usageLimit,
        usedCount: 0,
        oneTimeUse: data.oneTimeUse,
      }

      setCoupons((prev) => [newCoupon, ...prev])
      setOpenAddDialog(false)
      form.reset()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create coupon",
        variant: "destructive",
      })
    }
  }

  async function handleStatusChange(coupon: Coupon, newStatus: "active" | "disabled" | "expired") {
    const result = await updateCoupon(storeId, coupon.id, { status: newStatus })

    if (result.success) {
      toast({
        title: "Coupon updated",
        description: `The coupon has been ${newStatus}`,
      })

      // Update the coupon in the list
      setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? { ...c, status: newStatus } : c)))
    } else {
      toast({
        title: "Error",
        description: "Failed to update the coupon",
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
              placeholder="Search coupons..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
              <TabsTrigger value="disabled">Disabled</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>

          {can("create", "marketing") && (
            <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Coupon
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Coupon</DialogTitle>
                  <DialogDescription>Create a new discount coupon for your customers.</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Coupon Code</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="SUMMER20" />
                            </FormControl>
                            <FormDescription>Customers will enter this code at checkout.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a discount type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage Discount</SelectItem>
                                <SelectItem value="fixed">Fixed Amount</SelectItem>
                                <SelectItem value="free_shipping">Free Shipping</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Value</FormLabel>
                            <FormControl>
                              <div className="relative">
                                {form.watch("type") === "percentage" && (
                                  <div className="absolute right-3 top-2.5 text-muted-foreground">%</div>
                                )}
                                {form.watch("type") === "fixed" && (
                                  <div className="absolute left-3 top-2.5 text-muted-foreground">$</div>
                                )}
                                <Input
                                  {...field}
                                  type="number"
                                  className={form.watch("type") === "fixed" ? "pl-7" : undefined}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              {form.watch("type") === "percentage"
                                ? "Percentage discount off the order"
                                : form.watch("type") === "fixed"
                                  ? "Fixed amount discount in dollars"
                                  : "Free shipping on the order"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="minPurchase"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Purchase</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <div className="absolute left-3 top-2.5 text-muted-foreground">$</div>
                                <Input {...field} type="number" className="pl-7" />
                              </div>
                            </FormControl>
                            <FormDescription>Minimum order amount required (0 for no minimum).</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {form.watch("type") === "percentage" && (
                      <FormField
                        control={form.control}
                        name="maxDiscount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Discount</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <div className="absolute left-3 top-2.5 text-muted-foreground">$</div>
                                <Input
                                  {...field}
                                  type="number"
                                  className="pl-7"
                                  value={field.value ?? ""}
                                  onChange={(e) => {
                                    const value = e.target.value ? Number.parseFloat(e.target.value) : undefined
                                    field.onChange(value)
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Maximum discount amount in dollars (leave empty for no limit).
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Start Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant="outline" className="w-full pl-3 text-left font-normal">
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>End Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant="outline" className="w-full pl-3 text-left font-normal">
                                    {field.value ? format(field.value, "PPP") : <span>No end date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>Optional. Leave empty for no expiration.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="usageLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Usage Limit</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                value={field.value ?? ""}
                                onChange={(e) => {
                                  const value = e.target.value ? Number.parseInt(e.target.value) : undefined
                                  field.onChange(value)
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Maximum number of times this coupon can be used (leave empty for unlimited).
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="oneTimeUse"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>One-Time Use</FormLabel>
                              <FormDescription>Each customer can only use this coupon once.</FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <DialogFooter>
                      <Button type="submit">Create Coupon</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading coupons...</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">No coupons found.</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Code</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Discount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Dates</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Usage</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <Ticket className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{coupon.code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {coupon.type === "percentage" ? (
                        <span>{coupon.value}% off</span>
                      ) : coupon.type === "fixed" ? (
                        <span>${coupon.value.toFixed(2)} off</span>
                      ) : (
                        <span>Free shipping</span>
                      )}
                      {coupon.minPurchase && coupon.minPurchase > 0 && (
                        <span className="block text-xs text-muted-foreground">
                          Min. purchase: ${coupon.minPurchase.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>From: {format(new Date(coupon.startDate.seconds * 1000), "MMM d, yyyy")}</div>
                      {coupon.endDate && (
                        <div>To: {format(new Date(coupon.endDate.seconds * 1000), "MMM d, yyyy")}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>{coupon.usedCount} used</div>
                      {coupon.usageLimit && (
                        <div className="text-xs text-muted-foreground">Limit: {coupon.usageLimit}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          coupon.status === "active" ? "default" : coupon.status === "expired" ? "secondary" : "outline"
                        }
                      >
                        {coupon.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
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
                                /* Edit function */
                              }}
                            >
                              Edit coupon
                            </DropdownMenuItem>
                            {coupon.status !== "active" ? (
                              <DropdownMenuItem onClick={() => handleStatusChange(coupon, "active")}>
                                Activate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleStatusChange(coupon, "disabled")}>
                                Disable
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        )}
      </div>
    </div>
  )
}

