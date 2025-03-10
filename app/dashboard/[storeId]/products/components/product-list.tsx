"use client"

import { usePermissions } from "@/lib/hooks/usePermissions"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export function ProductList({ storeId, products }) {
  const { can } = usePermissions(storeId)

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Products</h2>
        
        {/* Only show Add Product button if user can create products */}
        {can('create', 'product') && (\
          <Button onClick={() => /* open create modal */}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>
      
      <div
  className="mt-4 space-y-4">
        {products.map((product) => (
          <div key={product.id} className="flex items-center justify-between p-4 border rounded-md">
            <div>
              <h3 className="font-medium">{product.name}</h3>
              <p className="text-sm text-muted-foreground">${product.price}
  </p>
  </div>
            
            <div className="flex gap-2">
  can('update', 'product') && (
                <Button variant="outline" size="sm" onClick={() => /* open edit modal */}>
                  Edit
                </Button>
              )
  can('delete', 'product') && (
                <Button variant="destructive" size="sm" onClick={() => /* confirm delete */}>
                  Delete
                </Button>
              )
  </div>
          </div>
        ))
}
</div>
    </div>
  )
}

