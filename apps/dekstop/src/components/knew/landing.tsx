import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight, BarChart3, Bitcoin, ChevronDown, Globe2, Menu, Search, Smartphone, Sparkles, TrendingUp, X, Zap } from "lucide-react";
import "./landing.css";
const marketViews = [
    { name: "Predictions", eyebrow: "A LITTLE CONVICTION GOES A LONG WAY", title: "See it coming?", accent: "Take a position.", description: "Sports, culture, politics, and the next big headline. Explore prediction markets and put your perspective into play.", question: "Will Bitcoin hit $150,000 this year?", value: "67%", unit: "chance", icon: Globe2 },
    { name: "Crypto", eyebrow: "FROM THE BIG NAMES TO THE NEXT BIG THING", title: "Find your", accent: "next obsession.", description: "From Bitcoin to the memecoin in your group chat. Discover crypto markets in one familiar interface.", question: "Bitcoin", value: "$98,420", unit: "BTC / USD", icon: Bitcoin },
    { name: "Perps", eyebrow: "A VIEW IN EITHER DIRECTION", title: "Up or down.", accent: "Your call.", description: "Explore long and short positions with a clear view of the market. Keep price action and your next move together.", question: "BTC perpetual", value: "$98,450", unit: "illustrative mark price", icon: Zap },
    { name: "Stocks", eyebrow: "BIG IDEAS. FAMILIAR COMPANIES.", title: "Think beyond", accent: "the ticker.", description: "Discover tokenized stock markets alongside crypto and predictions. Different markets, one place to explore.", question: "NVIDIA", value: "$182.64", unit: "illustrative token price", icon: BarChart3 },
];
function Logo() {
    return <Link to="/" className="ki-logo" aria-label="Knew It home"><span className="ki-mark" aria-hidden="true"><i /><b /><em /></span><span>knew it<span className="ki-logo-dot">.</span></span></Link>;
}
function Chart({ small = false }: {
    small?: boolean;
}) {
    return <svg className={small ? "ki-chart ki-chart-small" : "ki-chart"} viewBox="0 0 360 130" fill="none" aria-hidden="true"><path className="ki-gridline" d="M0 25H360M0 65H360M0 105H360"/><path className="ki-chart-area" d="M0 110L17 101L29 108L48 81L62 85L79 72L95 89L109 78L124 82L139 57L155 65L170 43L186 54L202 48L219 64L236 39L248 45L267 23L280 34L297 14L312 26L329 18L343 29L360 9V130H0Z"/><path className="ki-chart-stroke" d="M0 110L17 101L29 108L48 81L62 85L79 72L95 89L109 78L124 82L139 57L155 65L170 43L186 54L202 48L219 64L236 39L248 45L267 23L280 34L297 14L312 26L329 18L343 29L360 9"/></svg>;
}
function Phone({ side = false }: {
    side?: boolean;
}) {
    return <div className={`ki-phone ${side ? "ki-phone-side" : "ki-phone-main"}`} aria-label={side ? "Crypto interface illustration" : "Prediction market interface illustration"}>
    <div className="ki-phone-status"><span>9:41</span><span className="ki-island"/><span>▮▮▮ ▰</span></div>
    <div className="ki-phone-body">
      <div className="ki-phone-heading"><strong>{side ? "Your portfolio" : "Discover"}<span className="ki-yellow-dot"/></strong><Search size={18}/></div>
      <p className="ki-phone-sub">{side ? "A little bit of everything." : "Big ideas start with a little curiosity."}</p>
      {side ? <><p className="ki-balance">$24,680<span>.42</span></p><span className="ki-positive">↗ +$1,240.80 (5.29%)</span><Chart /><div className="ki-phone-tabs"><b>Assets</b><span>Activity</span></div>{[["₿", "Bitcoin", "BTC", "$12,840"], ["◎", "Solana", "SOL", "$6,420"], ["N", "NVIDIA", "Stock token", "$5,420"]].map(([symbol, name, ticker, price]) => <div className="ki-asset" key={name}><span className="ki-coin">{symbol}</span><div><b>{name}</b><small>{ticker}</small></div><strong>{price}</strong></div>)}</> : <><div className="ki-phone-tabs"><b>For you</b><span>Trending</span><span>Sports</span><span>Crypto</span></div><div className="ki-feature-market"><div className="ki-market-art"><span>₿</span><span className="ki-art-label">THE NEXT BIG MOVE</span></div><div className="ki-feature-content"><span className="ki-micro">CRYPTO · EXAMPLE MARKET</span><h3>Bitcoin to $150k<br />this year?</h3><div className="ki-odds"><strong>67<span>%</span></strong><span>chance<br /><b>↗ 8% today</b></span><Chart small/></div><div className="ki-outcomes"><span>Yes 67¢</span><span>No 33¢</span></div></div></div><div className="ki-phone-bottom-title"><b>On your radar</b><span>View all ↗</span></div><div className="ki-mini-market"><span>🏆</span><b>Who takes the title?</b><strong>48%</strong></div></>}
      <div className="ki-phone-nav"><Globe2 /><BarChart3 /><TrendingUp /><span className="ki-avatar">K</span></div>
    </div>
  </div>;
}
export function LandingPage() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeMarket, setActiveMarket] = useState(0);
    const market = marketViews[activeMarket] ?? marketViews[0]!;
    const MarketIcon = market.icon;
    return <div className="ki-landing">
    <a className="ki-skip" href="#main-content">Skip to content</a>
    <div className="ki-hero-wrap">
      <header className="ki-header">
        <Logo />
        <nav className="ki-desktop-nav" aria-label="Main navigation"><a href="#markets">Markets</a><a href="#experience">The experience</a><a href="#faq">FAQs</a></nav>
        <div className="ki-header-actions"><Link to="/sign-in" className="ki-login">Log in</Link><Link to="/markets" className="ki-button ki-button-dark ki-header-cta">Explore app <ArrowUpRight size={17}/></Link><button type="button" className="ki-menu-toggle" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="ki-mobile-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button></div>
      </header>
      {menuOpen && <nav id="ki-mobile-nav" className="ki-mobile-nav" aria-label="Mobile navigation"><a href="#markets" onClick={() => setMenuOpen(false)}>Markets</a><a href="#experience" onClick={() => setMenuOpen(false)}>The experience</a><a href="#faq" onClick={() => setMenuOpen(false)}>FAQs</a><Link to="/sign-in">Log in</Link></nav>}
      <main id="main-content">
        <section className="ki-hero" aria-labelledby="ki-hero-title">
          <div className="ki-hero-copy"><span className="ki-eyebrow"><span className="ki-status-dot"/> ONE APP. A WORLD OF POSSIBILITIES.</span><h1 id="ki-hero-title">A hunch.<br />A move.<br /><span>A knew it.</span></h1><p>From tomorrow’s headlines to your next favorite coin. Predictions, crypto, perps, and stocks. All together.</p><div className="ki-hero-actions"><Link to="/markets" className="ki-button ki-button-dark">Explore Knew It <ArrowUpRight size={20}/></Link><a className="ki-text-link" href="#markets">Take a look <ArrowRight size={18}/></a></div><div className="ki-platform-note"><Globe2 size={15}/><span>Explore the web demo</span><span className="ki-note-divider"/><Smartphone size={15}/><span>Mobile app planned</span></div></div>
          <div className="ki-hero-visual"><div className="ki-orbit ki-orbit-one"/><div className="ki-orbit ki-orbit-two"/><span className="ki-floating-star" aria-hidden="true">✳</span><Phone side/><Phone /><div className="ki-callout"><span className="ki-callout-icon"><Sparkles size={20}/></span><div><b>Trust your take.</b><span>There’s a market for that.</span></div></div><span className="ki-demo-caption">Product preview · illustrative data</span></div>
        </section>
      </main>
      <div className="ki-market-strip" aria-label="Markets to explore"><span>PREDICTIONS <Globe2 /></span><span>CRYPTO <Bitcoin /></span><span>MEMECOINS <Sparkles /></span><span>PERPS <Zap /></span><span>TOKENIZED STOCKS <BarChart3 /></span></div>
    </div>

    <section className="ki-section ki-markets" id="markets" aria-labelledby="ki-markets-title"><div className="ki-section-intro"><span className="ki-eyebrow">FOLLOW YOUR CURIOSITY</span><h2 id="ki-markets-title">Your world.<br /><span>Your markets.</span></h2><p>The things you follow. The ideas you believe in.<br />A home for every kind of market mind.</p></div>
      <div className="ki-tabs" role="tablist" aria-label="Explore market types">{marketViews.map((view, index) => <button key={view.name} type="button" role="tab" id={`ki-tab-${index}`} aria-selected={activeMarket === index} aria-controls="ki-market-panel" tabIndex={activeMarket === index ? 0 : -1} onClick={() => setActiveMarket(index)} onKeyDown={(event) => { let next = index; if (event.key === "ArrowRight")
        next = (index + 1) % marketViews.length;
    else if (event.key === "ArrowLeft")
        next = (index + marketViews.length - 1) % marketViews.length;
    else if (event.key === "Home")
        next = 0;
    else if (event.key === "End")
        next = marketViews.length - 1;
    else
        return; event.preventDefault(); setActiveMarket(next); document.getElementById(`ki-tab-${next}`)?.focus(); }}><view.icon size={18}/>{view.name}</button>)}</div>
      <div className="ki-market-panel" role="tabpanel" id="ki-market-panel" aria-labelledby={`ki-tab-${activeMarket}`} tabIndex={0}><div className="ki-panel-copy"><span className="ki-eyebrow">{market.eyebrow}</span><h3>{market.title}<br /><span>{market.accent}</span></h3><p>{market.description}</p><Link to="/markets" className="ki-text-link">Explore markets <ArrowUpRight size={19}/></Link></div><div className="ki-panel-visual"><div className="ki-trade-card"><div className="ki-trade-top"><span className="ki-market-symbol"><MarketIcon size={26}/></span><span className="ki-preview-badge">ILLUSTRATIVE PREVIEW</span></div><h4>{market.question}</h4><div className="ki-trade-value"><strong>{market.value}</strong><span>{market.unit}</span></div><Chart /><div className="ki-chart-labels"><span>9:00 AM</span><span>12:00 PM</span><span>3:00 PM</span></div><div className="ki-trade-footer"><span>{activeMarket === 0 ? "What’s your take?" : "Your next move starts here."}</span><ArrowUpRight size={20}/></div></div><span className="ki-panel-spark" aria-hidden="true">✳</span></div></div>
    </section>

    <section className="ki-experience" id="experience" aria-labelledby="ki-experience-title"><div className="ki-section"><div className="ki-experience-heading"><div><span className="ki-eyebrow">LESS SWITCHING. MORE EXPLORING.</span><h2 id="ki-experience-title">Big-picture thinking.<br />Pocket-size feeling.</h2></div><p>A trading experience that feels familiar.<br />Made for the way you see the world.</p></div><div className="ki-feature-grid"><article className="ki-feature-card ki-feature-yellow"><div className="ki-feature-number">01 / DISCOVER</div><h3>Find your<br />“wait, what if?”</h3><p>Go from a passing thought to a market worth exploring.</p><div className="ki-topic-cloud"><span>₿ Bitcoin</span><span>🏀 Sports</span><span>↗ Stocks</span><span>◎ Solana</span><span>🌎 World events</span><span>✳ Memecoins</span></div></article><article className="ki-feature-card ki-feature-lilac"><div className="ki-feature-number">02 / GET THE PICTURE</div><h3>Less noise.<br />More perspective.</h3><p>Charts, probabilities, and prices. The context for your next move.</p><div className="ki-insight"><div><span>Bitcoin prediction</span><strong>67<span>%</span></strong></div><Chart small/><span className="ki-insight-label">Illustrative probability</span></div></article><article className="ki-feature-card ki-feature-peach"><div className="ki-feature-number">03 / KEEP IT TOGETHER</div><h3>Different markets.<br />One home.</h3><p>Explore your watchlist and portfolio without losing your place.</p><div className="ki-stack"><span><Globe2 size={19}/> Predictions <ArrowUpRight size={16}/></span><span><Bitcoin size={19}/> Crypto <ArrowUpRight size={16}/></span><span><BarChart3 size={19}/> Tokenized stocks <ArrowUpRight size={16}/></span></div></article></div></div></section>

    <section className="ki-section ki-faq" id="faq" aria-labelledby="ki-faq-title"><div><span className="ki-eyebrow">GOOD QUESTIONS.</span><h2 id="ki-faq-title">Glad you asked.</h2><p>A little context before your next move.</p></div><div className="ki-faq-list">{[{ q: "What is Knew It?", a: "Knew It brings prediction markets, crypto, memecoins, perpetual futures, and tokenized stocks into one product experience. Start by exploring the web demo." }, { q: "Can I trade with real money yet?", a: "The current experience is a design demo with illustrative market data. Authentication and real-money trading are not connected." }, { q: "Is there a mobile app?", a: "A mobile app is planned. For now, you can explore the responsive web demo on your phone or desktop." }, { q: "What are prediction markets?", a: "Prediction markets let people take positions on the outcome of an event. Prices reflect the market’s view of its likelihood and can change as new information arrives." }].map(item => <details key={item.q}><summary>{item.q}<ChevronDown size={20}/></summary><p>{item.a}</p></details>)}</div></section>

    <section className="ki-final-cta"><span className="ki-eyebrow">YOU HAD A FEELING.</span><h2>Make it a<br /><span>“knew it.”</span></h2><Link to="/markets" className="ki-button ki-button-dark">Explore the app <ArrowUpRight size={20}/></Link><span className="ki-cta-star" aria-hidden="true">✳</span></section>
    <footer className="ki-footer"><div><Logo /><p>A home for your next move.</p></div><nav aria-label="Footer navigation"><a href="#markets">Markets</a><a href="#experience">The experience</a><a href="#faq">FAQs</a><Link to="/sign-in">Log in <ArrowUpRight size={14}/></Link></nav><div className="ki-footer-bottom"><span>© {new Date().getFullYear()} Knew It</span><span>Product demo. Illustrative data. Trading involves risk.</span></div></footer>
  </div>;
}
