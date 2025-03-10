"use client"

import { useState } from "react"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useToast } from "@/hooks/use-toast"
import { teamService } from "@/lib/services/teamService"
import type { TeamMember, UserRole } from "@/types/teams"
import { useStore } from "@/lib/hooks/useStore"
import { inviteTeamMember, updateTeamMemberRole, removeTeamMember } from "@/app/dashboard/team/actions"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Plus, User2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const inviteFormSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  role: z.enum(["editor", "viewer"], {
    required_error: "Please select a role",
  }),
})

export function TeamManagement({ storeId, currentUserId }: { storeId: string; currentUserId: string }) {
  const { toast } = useToast()
  const { store, loading } = useStore(storeId)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null)

  const form = useForm<z.infer<typeof inviteFormSchema>>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      role: "editor",
    },
  })

  // Fetch team members
  useState(() => {
    async function fetchTeamMembers() {
      try {
        const members = await teamService.getTeamMembers(storeId)
        setTeamMembers(members)
      } catch (error) {
        console.error("Error fetching team members:", error)
        toast({
          title: "Error",
          description: "Failed to load team members",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTeamMembers()
  }, [storeId, toast])

  // Invite new team member
  async function onSubmit(data: z.infer<typeof inviteFormSchema>) {
    setIsSubmitting(true)

    try {
      const result = await inviteTeamMember({
        email: data.email,
        role: data.role,
        storeId,
        teamName: store?.name || "Store",
        inviterName: store?.ownerName || "Store Owner",
      })

      if (result.success) {
        toast({
          title: "Invitation sent",
          description: `An invitation has been sent to ${data.email}`,
        })

        form.reset()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send invitation",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update member role
  async function handleRoleUpdate(userId: string, newRole: UserRole) {
    try {
      const result = await updateTeamMemberRole(storeId, userId, newRole)

      if (result.success) {
        setTeamMembers((prev) => prev.map((member) => (member.uid === userId ? { ...member, role: newRole } : member)))

        toast({
          title: "Role updated",
          description: "Team member role has been updated",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update role",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      })
    }
  }

  // Remove team member
  async function handleRemoveMember() {
    if (!memberToRemove) return

    try {
      const result = await removeTeamMember(storeId, memberToRemove.uid)

      if (result.success) {
        setTeamMembers((prev) => prev.filter((member) => member.uid !== memberToRemove.uid))

        toast({
          title: "Member removed",
          description: "Team member has been removed",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to remove team member",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive",
      })
    } finally {
      setMemberToRemove(null)
    }
  }

  // Check if user is store owner
  const isStoreOwner = store?.ownerId === currentUserId

  return (
    <div className="space-y-8">
      {/* Current team members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage who has access to this store and what they can do.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                  <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-1/4 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Store owner */}
              {store && (
                <div className="flex items-center gap-4 p-2 rounded-md bg-muted/30">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-muted">
                    {store.ownerPhotoURL ? (
                      <Image
                        src={store.ownerPhotoURL || "/placeholder.svg"}
                        alt={store.ownerName || "Store Owner"}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                        <User2 className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{store.ownerName || "Store Owner"}</div>
                    <div className="text-sm text-muted-foreground">{store.ownerEmail}</div>
                  </div>
                  <div className="rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">Owner</div>
                </div>
              )}

              {/* Team members */}
              {teamMembers.length > 0 ? (
                <div className="space-y-2">
                  {teamMembers.map((member) => (
                    <div key={member.uid} className="flex items-center gap-4 p-2">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-muted">
                        {member.photoURL ? (
                          <Image
                            src={member.photoURL || "/placeholder.svg"}
                            alt={member.displayName || member.email}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                            <User2 className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{member.displayName || "Team Member"}</div>
                        <div className="text-sm text-muted-foreground">{member.email}</div>
                      </div>

                      {isStoreOwner ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onSelect={() => handleRoleUpdate(member.uid, "editor")}
                              disabled={member.role === "editor"}
                            >
                              Make Editor
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => handleRoleUpdate(member.uid, "viewer")}
                              disabled={member.role === "viewer"}
                            >
                              Make Viewer
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onSelect={() => setMemberToRemove(member)}>
                              Remove from team
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <div className="rounded bg-muted px-2 py-1 text-xs font-medium">
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground">No team members yet. Invite people to work together.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite new member form */}
      {isStoreOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Invite New Member</CardTitle>
            <CardDescription>Send an invitation to collaborate on this store</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="colleague@example.com" />
                      </FormControl>
                      <FormDescription>The email address of the person you want to invite.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="editor">Editor - Can modify content but not billing or team</SelectItem>
                          <SelectItem value="viewer">Viewer - Read-only access to content</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>This determines what they can access in your store.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isSubmitting} className="flex w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Sending Invitation..." : "Invite Team Member"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Confirmation dialog for removing team members */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToRemove?.displayName || memberToRemove?.email} from the team? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

