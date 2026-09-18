import { useState, type FormEvent } from "react";
import { CheckCircle2, Eye, EyeOff, LockKeyhole, TrendingUp } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Brand } from "./brand";
import { Sparkline } from "./sparkline";
import { DemoBadge } from "./market-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignInPage() {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  function submit(e: FormEvent) {
    e.preventDefault();
    setMessage("Authentication is not connected in this demo.");
  }
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.15fr_.85fr]">
      <section className="relative hidden overflow-hidden border-r border-border bg-secondary p-12 lg:flex lg:flex-col">
        <Brand />
        <div className="my-auto max-w-2xl">
          <DemoBadge />
          <h1 className="mt-6 max-w-xl font-display text-5xl font-semibold leading-[1.06]">
            Your next move starts here.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-7 text-muted-foreground">
            Predictions, crypto, memecoins, perps, and tokenized stocks. One app.
          </p>
          <div className="relative mt-12 h-80">
            <div className="absolute left-0 top-0 w-[68%] rounded-xl border border-border bg-card p-5 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs text-primary">Featured prediction</span>
                <DemoBadge />
              </div>
              <p className="mt-4 font-semibold">Will Bitcoin reach $150K before 2027?</p>
              <div className="mt-6 grid grid-cols-[auto_1fr] items-end gap-6">
                <div>
                  <span className="text-4xl font-semibold tabular-nums">57%</span>
                  <p className="text-xs text-muted-foreground">chance</p>
                </div>
                <Sparkline points={[38, 41, 47, 43, 49, 51, 48, 54, 52, 55, 57]} />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <span className="rounded-md bg-primary p-2 text-center text-xs font-semibold text-primary-foreground">
                  Yes · 57¢
                </span>
                <span className="rounded-md bg-secondary p-2 text-center text-xs">No · 43¢</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 w-[45%] rounded-xl border border-border bg-card p-5 shadow-2xl">
              <p className="text-xs text-muted-foreground">Portfolio value · Demo</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums">$24,680.42</p>
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-positive">
                <TrendingUp className="size-3" />
                +5.29% this month
              </p>
              <div className="mt-5 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Predictions</span>
                  <span>48%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Crypto</span>
                  <span>27%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Markets involve risk. Trade responsibly.</p>
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Brand />
            <div className="mt-7 rounded-xl border border-border bg-card p-4">
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">BTC prediction · Demo</span>
                <span className="text-sm font-semibold">57%</span>
              </div>
              <Sparkline points={[38, 41, 47, 43, 49, 51, 48, 54, 52, 55, 57]} height={46} />
            </div>
          </div>
          <h2 className="font-display text-3xl font-semibold">Welcome to Knew It</h2>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to continue to your markets.</p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                className="h-11 bg-secondary"
              />
            </div>
            <div>
              <div className="mb-2 flex justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <button type="button" className="text-xs text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  required
                  minLength={8}
                  className="h-11 bg-secondary pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-0 top-0 grid size-11 place-items-center text-muted-foreground hover:text-foreground"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            {message && (
              <div
                className="rounded-lg border border-border bg-secondary p-3 text-xs text-muted-foreground"
                role="status"
              >
                {message}
              </div>
            )}
            <Button type="submit" className="h-11 w-full">
              <LockKeyhole />
              Sign in
            </Button>
          </form>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button
            variant="secondary"
            className="h-11 w-full"
            onClick={() => setMessage("Authentication is not connected in this demo.")}
          >
            <CheckCircle2 />
            Continue with passkey
          </Button>
          <p className="mt-7 text-center text-xs leading-5 text-muted-foreground">
            By continuing, you agree to the{" "}
            <button className="text-foreground hover:underline">Terms</button> and{" "}
            <button className="text-foreground hover:underline">Privacy Policy</button>.
          </p>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Previewing the product?{" "}
            <Link to="/" className="font-medium text-primary hover:underline">
              Explore demo
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
