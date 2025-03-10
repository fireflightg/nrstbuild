"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CouponForm } from "@/components/checkout/coupon-form"

interface CheckoutSummaryProps {
  storeId: string
  subtotal: number
  tax: number
  shipping: number
  items: { id: string; productId: string; quantity: number; price: number }[]
  onProceedToPayment: (total: number, discountAmount?: number, couponId?: string, couponCode?: string) => void
}

export function CheckoutSummary({ storeId, subtotal, tax, shipping, items, onProceedToPayment }: CheckoutSummaryProps) {
  const [discountAmount, setDiscountAmount] = useState(0)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string
    code: string
  } | null>(null)

  const total = subtotal + tax + shipping - discountAmount
  const productIds = items.map((item) => item.productId)

  const handleApplyCoupon = (amount: number, couponId: string, couponCode: string) => {
    setDiscountAmount(amount)
    setAppliedCoupon({ id: couponId, code: couponCode })
  }

  const handleRemoveCoupon = () => {
    setDiscountAmount(0)
    setAppliedCoupon(null)
  }

  const handleProceedToPayment = () => {
    onProceedToPayment(total, discountAmount > 0 ? discountAmount : undefined, appliedCoupon?.id, appliedCoupon?.code)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
        <CardDescription>Review your order details before payment.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Shipping</span>
            <span>${shipping.toFixed(2)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600 font-medium">
              <span>Discount</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex justify-between font-medium">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>

        <Separator />

        <CouponForm
          storeId={storeId}
          cartTotal={subtotal}
          productIds={productIds}
          onApplyCoupon={handleApplyCoupon}
          onRemoveCoupon={handleRemoveCoupon}
        />
      </CardContent>
      <CardFooter>
        <Button className="w-full" size="lg" onClick={handleProceedToPayment}>
          Proceed to Payment
        </Button>
      </CardFooter>
    </Card>
  )
}

