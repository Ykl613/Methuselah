"use client";
import { useEffect, useState } from "react";

interface GreetingHeaderProps {
  fullName: string;
  taskCount: number;
}

// 40+ motivational messages — rotates randomly each load
const motivationalMessages = {
  // When there are 0 tasks
  noTasks: [
    "All caught up. Nice work! 🎉",
    "Inbox zero achieved. You're crushing it! 🚀",
    "Nothing on your plate. Perfect time for a coffee ☕",
    "Smooth sailing today. Well done! ⛵",
    "Empty queue, full heart. Enjoy the moment! 💜",
    "Mission accomplished. You earned this break! 🏆",
    "All clear. Take a breath — you deserve it 🌿",
    "Tasks: 0. Productivity: ∞ 🔥",
    "Clean slate. Where will today take you? ✨",
    "Everything's handled. Time to dream big 💭",
    "You've reached the end of the list. Bravo! 👏",
    "Zero pending. Hero status confirmed. 🦸",
    "Calm waters today. Enjoy the view 🌊",
    "Nothing in the queue. Perfection. 💎",
    "Task list cleared. Now go conquer the world 🌍",
  ],
  // When there are tasks
  withTasks: [
    "Let's make today count! 💪",
    "One task at a time. You've got this! 🎯",
    "Progress over perfection. Keep going! 🚀",
    "Small steps, big impact. Let's go! ⚡",
    "Focus mode activated. Time to ship! 🛠️",
    "Today is yours. Make it productive! ☀️",
    "Every task done is progress made 🌱",
    "Breathe in, focus, execute. You've got this! 🧘",
    "Champions show up. And you're here. 🏅",
    "Let's turn that list into wins! 🎉",
    "The best way out is through. Start now! 🌟",
    "One step closer to the finish line 🏁",
    "Quality work starts now. Let's do it! ✨",
    "Productivity is a habit. Build it today! 📈",
    "Your future self will thank you. 💫",
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getGreeting(firstName: string, hour: number): { greeting: string; emoji: string } {
  if (hour < 5) return { greeting: `Working late, ${firstName}`, emoji: "🌙" };
  if (hour < 12) return { greeting: `Good morning, ${firstName}`, emoji: "👋" };
  if (hour < 17) return { greeting: `Good afternoon, ${firstName}`, emoji: "☀️" };
  if (hour < 21) return { greeting: `Good evening, ${firstName}`, emoji: "🌆" };
  return { greeting: `Good evening, ${firstName}`, emoji: "🌙" };
}

function formatDateTime(date: Date): { date: string; time: string } {
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return { date: dateStr, time: timeStr };
}

export function GreetingHeader({ fullName, taskCount }: GreetingHeaderProps) {
  const [now, setNow] = useState(new Date());
  const firstName = (fullName || "").split(" ")[0] || "";

  // Pick a random motivational message on mount (and re-pick if task count changes between 0 and non-0)
  const [motivation] = useState(() =>
    taskCount === 0 ? pickRandom(motivationalMessages.noTasks) : pickRandom(motivationalMessages.withTasks)
  );

  // Update every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { greeting, emoji } = getGreeting(firstName, now.getHours());
  const { date, time } = formatDateTime(now);

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <p className="text-[12px] text-text-muted font-medium uppercase tracking-[1.2px]">{date}</p>
        <span className="text-[12px] text-text-muted">·</span>
        <p className="text-[12px] text-accent font-mono font-semibold tracking-tight">{time}</p>
      </div>
      <h1 className="text-[28px] font-semibold tracking-[-0.6px] text-text-primary">
        {greeting} <span className="text-[24px]">{emoji}</span>
      </h1>
      <p className="text-[14px] text-text-secondary mt-1.5">
        {taskCount > 0 ? (
          <>
            You have <span className="text-accent font-semibold">{taskCount} task{taskCount !== 1 ? "s" : ""}</span> awaiting · {motivation}
          </>
        ) : (
          motivation
        )}
      </p>
    </div>
  );
}
