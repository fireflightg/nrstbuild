"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useToast } from "@/hooks/use-toast"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import type { TeamMember } from "@/types/teams"

const transferSchema = z.object({
  newOwnerId: z.string({
    required_error: "Please select a team member",
  }),
})

async function transferOwnership(storeId: string, newOwnerId: string) {
  // This would be a server action
  const response = await fetch(`/api/stores/${storeId}/transfer-ownership`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ newOwnerId }),
  })

  return response.json()
}

export function TransferOwnershipDialog({
  storeId,
  teamMembers,
}: {
  storeId: string
  teamMembers: TeamMember[]
}) {
  const { toast } = useToast()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
  })

  async function onSubmit(data: z.infer<typeof transferSchema>) {
    setIsSubmitting(true)

    try {
      const result = await transferOwnership(storeId, data.newOwnerId)

      if (result.success) {
        toast({
          title: "Ownership transferred",
          description: "Store ownership has been transferred successfully",
        })

        setOpen(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to transfer ownership",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to transfer ownership",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="text-destructive">
          Transfer Ownership
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Transfer Store Ownership</AlertDialogTitle>
          <AlertDialogDescription>
            This action will transfer ownership of this store to another team member. You will become an editor and will
            no longer have access to billing or team management.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="newOwnerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Owner</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.uid} value={member.uid}>
                          {member.displayName || member.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Select the team member who will become the new owner.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="bg-destructive text-destructive-foreground"
          >
            {isSubmitting ? "Transferring..." : "Transfer Ownership"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

