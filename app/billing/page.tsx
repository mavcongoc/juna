"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, CreditCard, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

type PlanFeature = {
  name: string
  included: boolean
}

type Plan = {
  id: string
  name: string
  price: number
  interval: "month" | "year"
  description: string
  features: PlanFeature[]
  popular?: boolean
}

export default function BillingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("month")
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Redirect if not logged in
  if (!user) {
    router.push("/auth/signin?redirectedFrom=/billing")
    return null
  }

  const plans: Plan[] = [
    {
      id: "free",
      name: "Free",
      price: 0,
      interval: "month",
      description: "Basic journaling features",
      features: [
        { name: "Daily journaling", included: true },
        { name: "Basic insights", included: true },
        { name: "3 AI-powered reflections per day", included: true },
        { name: "Voice journaling (1 min limit)", included: true },
        { name: "Advanced analytics", included: false },
        { name: "Unlimited AI reflections", included: false },
        { name: "Extended voice journaling", included: false },
        { name: "Priority support", included: false },
      ],
    },
    {
      id: "premium-monthly",
      name: "Premium",
      price: 9.99,
      interval: "month",
      description: "Full access to all features",
      features: [
        { name: "Daily journaling", included: true },
        { name: "Basic insights", included: true },
        { name: "Unlimited AI-powered reflections", included: true },
        { name: "Voice journaling (unlimited)", included: true },
        { name: "Advanced analytics", included: true },
        { name: "Custom journal prompts", included: true },
        { name: "Export journal entries", included: true },
        { name: "Priority support", included: true },
      ],
      popular: true,
    },
    {
      id: "premium-yearly",
      name: "Premium",
      price: 99.99,
      interval: "year",
      description: "Full access to all features",
      features: [
        { name: "Daily journaling", included: true },
        { name: "Basic insights", included: true },
        { name: "Unlimited AI-powered reflections", included: true },
        { name: "Voice journaling (unlimited)", included: true },
        { name: "Advanced analytics", included: true },
        { name: "Custom journal prompts", included: true },
        { name: "Export journal entries", included: true },
        { name: "Priority support", included: true },
      ],
      popular: true,
    },
  ]

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)
    setSuccessMessage(null)
    setErrorMessage(null)
  }

  const handleSubscribe = async () => {
    if (!selectedPlan) return

    setIsProcessing(true)
    setSuccessMessage(null)
    setErrorMessage(null)

    try {
      // This would be implemented with a real API call to handle subscription
      // For now, we'll just simulate a successful subscription
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setSuccessMessage("Subscription updated successfully!")
    } catch (error) {
      console.error("Error updating subscription:", error)
      setErrorMessage("Failed to update subscription. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredPlans = plans.filter((plan) => plan.interval === billingInterval || plan.id === "free")

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold">Subscription Plans</h1>
        <p className="text-muted-foreground mt-2">Choose the plan that works best for you</p>
      </div>

      <Tabs
        defaultValue="month"
        className="mb-8"
        onValueChange={(value) => setBillingInterval(value as "month" | "year")}
      >
        <div className="flex justify-center">
          <TabsList>
            <TabsTrigger value="month">Monthly</TabsTrigger>
            <TabsTrigger value="year">Yearly (Save 17%)</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      <div className="grid md:grid-cols-3 gap-6">
        {filteredPlans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative overflow-hidden ${
              selectedPlan === plan.id ? "border-primary ring-1 ring-primary" : ""
            } ${plan.popular ? "border-secondary" : ""}`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-xs py-1 px-3 rounded-bl-lg">
                Popular
              </div>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-2">
                <span className="text-3xl font-bold">${plan.price}</span>
                {plan.price > 0 && <span className="text-muted-foreground ml-1">/{plan.interval}</span>}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    {feature.included ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-muted-foreground/30 mr-2" />
                    )}
                    <span className={feature.included ? "" : "text-muted-foreground"}>{feature.name}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className={`w-full ${plan.popular ? "bg-secondary hover:bg-secondary/90" : ""}`}
                onClick={() => handleSelectPlan(plan.id)}
                variant={plan.id === "free" ? "outline" : "default"}
              >
                {plan.id === "free" ? "Current Plan" : "Select Plan"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {selectedPlan && selectedPlan !== "free" && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You'll be charged ${plans.find((p) => p.id === selectedPlan)?.price}{" "}
                {billingInterval === "month" ? "per month" : "per year"}.
              </p>
              <Button onClick={handleSubscribe} disabled={isProcessing} className="w-full">
                {isProcessing ? "Processing..." : "Subscribe Now"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {successMessage && (
        <Alert className="mt-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert className="mt-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
