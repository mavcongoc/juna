import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, BarChart, MessageSquare, CheckCircle } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32 flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 z-0"></div>
        <div className="absolute top-20 right-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-secondary/20 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-4 z-10">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-light mb-6">
              Your mindful companion for <span className="text-gradient font-normal">self-reflection</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-10 max-w-lg mx-auto">
              Journal your thoughts, track your emotions, and gain insights for personal growth and emotional wellbeing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/journal">
                <Button size="lg" className="rounded-full px-8 w-full sm:w-auto">
                  Start Writing
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button variant="outline" size="lg" className="rounded-full px-8 w-full sm:w-auto">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-light text-center mb-12">
            How Juna helps you <span className="text-gradient">grow</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm card-hover">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-2">Write</h3>
              <p className="text-muted-foreground">
                Express your thoughts and feelings through guided journaling prompts.
              </p>
            </div>

            <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm card-hover">
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-medium mb-2">Talk</h3>
              <p className="text-muted-foreground">
                Speak your mind and let Juna transcribe your thoughts or chat with AI.
              </p>
            </div>

            <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm card-hover">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <BarChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium mb-2">Insights</h3>
              <p className="text-muted-foreground">Gain therapeutic insights and identify patterns in your thoughts.</p>
            </div>

            <div className="bg-background/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm card-hover">
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="text-xl font-medium mb-2">Actions</h3>
              <p className="text-muted-foreground">
                Track your progress on recommended activities for emotional growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-light mb-12">What our users say</h2>

          <div className="max-w-3xl mx-auto bg-muted/30 backdrop-blur-sm rounded-2xl p-8 relative">
            <div className="absolute -top-4 -left-4 text-5xl text-primary opacity-50">"</div>
            <div className="absolute -bottom-4 -right-4 text-5xl text-primary opacity-50">"</div>
            <p className="text-lg italic mb-6">
              Juna has helped me understand my emotions better than ever before. The insights I get from my journal
              entries have been eye-opening.
            </p>
            <p className="font-medium">Alex P.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/20 to-secondary/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-light mb-6">Ready to start your journey?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
            Join thousands of users who are improving their mental wellbeing with Juna.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="rounded-full px-8">
              Get Started
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
