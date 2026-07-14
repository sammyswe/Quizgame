export interface Question {
  text: string;
  options: string[];
  correctIndex: number;
}

export const QUESTION_BANK: Question[] = [
  {
    text: "Which sea creature has three hearts?",
    options: ["Octopus", "Shark", "Dolphin", "Sea Turtle"],
    correctIndex: 0,
  },
  {
    text: "What did pirates call their flag?",
    options: ["Skull Banner", "Jolly Roger", "Black Mark", "Dead Sail"],
    correctIndex: 1,
  },
  {
    text: "Which of these is a real pirate?",
    options: ["Redbeard Rick", "Captain Storm", "Anne Bonny", "Silver Sam"],
    correctIndex: 2,
  },
  {
    text: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correctIndex: 3,
  },
  {
    text: "A doubloon was a coin made of what?",
    options: ["Gold", "Silver", "Copper", "Bronze"],
    correctIndex: 0,
  },
  {
    text: "Which instrument helped sailors find latitude?",
    options: ["Barometer", "Sextant", "Chronograph", "Anemometer"],
    correctIndex: 1,
  },
  {
    text: "Blackbeard's real name was...",
    options: ["William Kidd", "Henry Morgan", "Edward Teach", "Bart Roberts"],
    correctIndex: 2,
  },
  {
    text: "What fruit prevented scurvy on long voyages?",
    options: ["Bananas", "Apples", "Coconuts", "Limes"],
    correctIndex: 3,
  },
  {
    text: "Which casino game is known as 21?",
    options: ["Blackjack", "Roulette", "Baccarat", "Craps"],
    correctIndex: 0,
  },
  {
    text: "The Bermuda Triangle touches Miami, Puerto Rico and...",
    options: ["Cuba", "Bermuda", "Bahamas", "Jamaica"],
    correctIndex: 1,
  },
];

export function pickQuestions(count: number): Question[] {
  const pool = [...QUESTION_BANK];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}
