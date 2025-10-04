import React, { useEffect, useRef, useState } from "react";

export default function StatsSection() {
  // Stats with final values
  const stats = [
    { value: 15000, suffix: "k+", label: "Happy Customers" },
    { value: 300, suffix: "+", label: " Car Models" },
    { value: 6, suffix: "+", label: "Locations" },
    { value: 24, suffix: "/7", label: "Customer Support" },
  ];

  const [visible, setVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-gradient-to-r from-green-400 via-blue-400 to-blue-600 text-white py-12"
    >
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((stat, i) => (
          <StatItem
            key={i}
            value={stat.value}
            suffix={stat.suffix}
            label={stat.label}
            visible={visible}
          />
        ))}
      </div>
    </section>
  );
}

// Separate component for each stat
function StatItem({ value, suffix, label, visible }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (visible) {
      let start = 0;
      const end = value;
      const duration = 1500; // ms
      const stepTime = 20;
      const steps = Math.ceil(duration / stepTime);
      const increment = end / steps;

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          clearInterval(timer);
          start = end;
        }
        setCount(Math.floor(start));
      }, stepTime);

      return () => clearInterval(timer);
    }
  }, [visible, value]);

  return (
    <div>
      <div className="text-4xl font-extrabold">
        {visible ? `${count}${suffix}` : `0${suffix}`}
      </div>
      <div className="text-sm mt-1">{label}</div>
    </div>
  );
}
