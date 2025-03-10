import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase/admin"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get("stripe-signature")

    if (!signature) {
      return new NextResponse(JSON.stringify({ error: "Missing stripe signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Verify the webhook signature
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err}`)
      return new NextResponse(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSessionCompleted(session)
        break

      case "invoice.paid":
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(invoice)
        break

      case "customer.subscription.updated":
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break

      case "customer.subscription.deleted":
        const deletedSubscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(deletedSubscription)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new NextResponse(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Error handling webhook:", error)
    return new NextResponse(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// Helper functions for handling webhook events
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Process the successful checkout
  if (!session.client_reference_id) {
    console.error("No client_reference_id found in session")
    return
  }

  // Extract store ID and user ID from the client reference
  const [storeId, userId] = session.client_reference_id.split("_")

  // Update the store subscription status
  await db
    .collection("stores")
    .doc(storeId)
    .update({
      subscriptionStatus: "active",
      subscriptionId: session.subscription as string,
      updatedAt: new Date().toISOString(),
    })

  // Create a record in the subscriptions collection
  await db
    .collection("subscriptions")
    .doc(session.subscription as string)
    .set({
      userId,
      storeId,
      status: "active",
      stripeCustomerId: session.customer as string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Process the paid invoice
  const subscriptionId = invoice.subscription as string

  // Update the subscription record
  const subscriptionDoc = await db.collection("subscriptions").doc(subscriptionId).get()

  if (!subscriptionDoc.exists) {
    console.error(`Subscription ${subscriptionId} not found`)
    return
  }

  const subscriptionData = subscriptionDoc.data()

  // Update the subscription
  await db
    .collection("subscriptions")
    .doc(subscriptionId)
    .update({
      status: "active",
      currentPeriodEnd: new Date((invoice.lines.data[0].period.end as number) * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    })

  // Update the store subscription status
  await db.collection("stores").doc(subscriptionData?.storeId).update({
    subscriptionStatus: "active",
    updatedAt: new Date().toISOString(),
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Process the updated subscription
  const subscriptionDoc = await db.collection("subscriptions").doc(subscription.id).get()

  if (!subscriptionDoc.exists) {
    console.error(`Subscription ${subscription.id} not found`)
    return
  }

  const subscriptionData = subscriptionDoc.data()

  // Update the subscription status
  await db
    .collection("subscriptions")
    .doc(subscription.id)
    .update({
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    })

  // Update the store subscription status
  await db.collection("stores").doc(subscriptionData?.storeId).update({
    subscriptionStatus: subscription.status,
    updatedAt: new Date().toISOString(),
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Process the deleted subscription
  const subscriptionDoc = await db.collection("subscriptions").doc(subscription.id).get()

  if (!subscriptionDoc.exists) {
    console.error(`Subscription ${subscription.id} not found`)
    return
  }

  const subscriptionData = subscriptionDoc.data()

  // Update the subscription status
  await db.collection("subscriptions").doc(subscription.id).update({
    status: "canceled",
    updatedAt: new Date().toISOString(),
  })

  // Update the store subscription status
  await db.collection("stores").doc(subscriptionData?.storeId).update({
    subscriptionStatus: "canceled",
    updatedAt: new Date().toISOString(),
  })
}

