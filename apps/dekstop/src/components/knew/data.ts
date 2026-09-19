export type Prediction = {
  id: string;
  category: string;
  question: string;
  probability: number;
  change: number;
  volume: string;
  ends: string;
  image: string;
  points: number[];
  multi?: { label: string; value: number }[];
};

export const featuredPrediction: Prediction = {
  id: "fed-rate-september",
  category: "Finance",
  question: "Will the Fed cut rates at the September meeting?",
  probability: 68,
  change: 7.4,
  volume: "$8.4M",
  ends: "Sep 18",
  image: "election",
  points: [42, 45, 44, 49, 53, 51, 58, 62, 59, 65, 68],
};

export const predictions: Prediction[] = [
  {
    id: "fed-rate-september",
    category: "Finance",
    question: "Will the Fed cut rates at the September meeting?",
    probability: 68,
    change: 7.4,
    volume: "$8.4M",
    ends: "Sep 18",
    image: "election",
    points: [42, 45, 44, 49, 53, 51, 58, 62, 59, 65, 68],
  },
  {
    id: "bitcoin-150k",
    category: "Crypto",
    question: "Will Bitcoin reach $150K before 2027?",
    probability: 57,
    change: 3.2,
    volume: "$5.7M",
    ends: "Dec 31",
    image: "bitcoin",
    points: [38, 41, 47, 43, 49, 51, 48, 54, 52, 55, 57],
  },
  {
    id: "spacex-mars",
    category: "Culture",
    question: "Will SpaceX launch a Mars mission before 2029?",
    probability: 41,
    change: -2.1,
    volume: "$2.1M",
    ends: "Dec 2028",
    image: "launch",
    points: [55, 52, 50, 48, 49, 46, 45, 43, 44, 42, 41],
  },
  {
    id: "world-cup",
    category: "Sports",
    question: "Who will win the 2026 World Cup?",
    probability: 24,
    change: 1.8,
    volume: "$12.6M",
    ends: "Jul 19",
    image: "election",
    points: [16, 18, 17, 20, 19, 21, 22, 21, 23, 22, 24],
    multi: [
      { label: "Spain", value: 24 },
      { label: "France", value: 19 },
      { label: "Brazil", value: 16 },
    ],
  },
];

export const assets = [
  {
    kind: "Crypto",
    icon: "₿",
    name: "Bitcoin",
    ticker: "BTC",
    price: "$118,742.18",
    change: "+2.84%",
    volume: "$48.2B",
    trend: true,
  },
  {
    kind: "Crypto",
    icon: "Ξ",
    name: "Ethereum",
    ticker: "ETH",
    price: "$4,286.72",
    change: "+1.42%",
    volume: "$21.9B",
    trend: true,
  },
  {
    kind: "Memecoin",
    icon: "D",
    name: "Dogecoin",
    ticker: "DOGE",
    price: "$0.2284",
    change: "−3.17%",
    volume: "$2.4B",
    trend: false,
  },
  {
    kind: "Perp",
    icon: "S",
    name: "Solana Perpetual",
    ticker: "SOL-PERP",
    price: "$241.80",
    change: "+5.06%",
    volume: "$6.8B",
    trend: true,
  },
  {
    kind: "Tokenized stock",
    icon: "N",
    name: "NVIDIA",
    ticker: "NVDAx",
    price: "$187.42",
    change: "+0.88%",
    volume: "$14.7M",
    trend: true,
  },
];
