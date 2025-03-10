"use client"

import { useState } from "react"
import { useAuthApi } from "@/hooks/use-auth-api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export function ProtectedApiExample({ storeId }: { storeId: string }) {
  const { toast } = useToast()
  const { get, post, isLoading, error } = useAuthApi({
    onError: (err) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    },
  })

  const [store, setStore] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])

  const fetchStore = async () => {
    const data = await get<any>(`stores/${storeId}`)
    if (data) {
      setStore(data)
      toast({
        title: "Success",
        description: "Store data fetched successfully",
      })
    }
  }

  const fetchProducts = async () => {
    const data = await get<{ products: any[] }>(`stores/${storeId}/products`)
    if (data) {
      setProducts(data.products)
      toast({
        title: "Success",
        description: `Fetched ${data.products.length} products`,
      })
    }
  }

  const createProduct = async () => {
    const newProduct = {
      name: `Product ${Math.floor(Math.random() * 1000)}`,
      description: "This is a test product",
      price: Math.floor(Math.random() * 100) + 1,
      currency: "USD",
      isActive: true,
    }

    const data = await post<{ productId: string }>(`stores/${storeId}/products`, newProduct)
    if (data) {
      toast({
        title: "Success",
        description: `Product created with ID: ${data.productId}`,
      })
      fetchProducts()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Protected API Example</CardTitle>
        <CardDescription>This component demonstrates making authenticated API requests</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <div className="p-4 bg-destructive/10 text-destructive rounded-md">{error.message}</div>}

        {store && (
          <div className="p-4 bg-muted rounded-md">
            <h3 className="font-medium">Store Details</h3>
            <p>Name: {store.name}</p>
            <p>Description: {store.description}</p>
          </div>
        )}

        {products.length > 0 && (
          <div className="p-4 bg-muted rounded-md">
            <h3 className="font-medium">Products ({products.length})</h3>
            <ul className="mt-2 space-y-2">
              {products.map((product) => (
                <li key={product.id} className="p-2 bg-background rounded-md">
                  {product.name} - ${product.price}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button onClick={fetchStore} disabled={isLoading}>
          {isLoading ? "Loading..." : "Fetch Store"}
        </Button>
        <Button onClick={fetchProducts} disabled={isLoading}>
          {isLoading ? "Loading..." : "Fetch Products"}
        </Button>
        <Button onClick={createProduct} disabled={isLoading}>
          {isLoading ? "Loading..." : "Create Product"}
        </Button>
      </CardFooter>
    </Card>
  )
}

