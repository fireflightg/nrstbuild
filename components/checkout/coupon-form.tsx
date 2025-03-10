"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { validateCoupon } from "@/app/dashboard/[storeId]/marketing/actions"
import { useToast } from "@/hooks/use-toast"
import { Ticket, X } from "lucide-react"

const couponFormSchema = z.object({
  code: z.string().min(1, "Please enter a coupon code"),
})

interface CouponFormProps {
  storeId: string
  cartTotal: number
  productIds?: string[]
  onApplyCoupon: (discountAmount: number, couponId: string, couponCode: string) => void
  onRemoveCoupon: () => void
}

export function CouponForm({ storeId, cartTotal, productIds, onApplyCoupon, onRemoveCoupon }: CouponFormProps) {
  const { toast } = useToast()
  const [isApplying, setIsApplying] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discountAmount: number
    couponId: string
  } | null>(null)

  const form = useForm<z.infer<typeof couponFormSchema>>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: "",
    },
  })

  async function onSubmit(data: z.infer<typeof couponFormSchema>) {
    setIsApplying(true)

    try {
      const result = await validateCoupon(storeId, data.code, cartTotal, productIds)

      if (result.valid && result.coupon) {
        setAppliedCoupon({
          code: result.coupon.code,
          discountAmount: result.discountAmount!,
          couponId: result.coupon.id,
        })

        onApplyCoupon(result.discountAmount!, result.coupon.id, result.coupon.code)

        toast({
          title: "Coupon applied",
          description: `Discount: $${result.discountAmount!.toFixed(2)}`,
        })
      } else {
        toast({
          title: "Invalid coupon",
          description: result.error || "This coupon cannot be applied to your order",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error validating coupon:", error)
      toast({
        title: "Error",
        description: "Failed to validate coupon",
        variant: "destructive",
      })
    } finally {
      setIsApplying(false)
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null)
    onRemoveCoupon()
    form.reset()
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Discount Code</p>

      {appliedCoupon ? (
        <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-primary" />
            <span className="font-medium">{appliedCoupon.code}</span>
            <span className="text-sm text-muted-foreground">(-${appliedCoupon.discountAmount.toFixed(2)})</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRemoveCoupon} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
            <span className="sr-only">Remove coupon</span>
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input {...field} placeholder="Enter code" className="h-9" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="sm" disabled={isApplying} className="h-9">
              {isApplying ? "Applying..." : "Apply"}
            </Button>
          </form>
        </Form>
      )}
    </div>
  )
}

