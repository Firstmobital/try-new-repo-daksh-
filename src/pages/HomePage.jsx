import React, { useEffect, useState, useRef } from "react";
import CarGrid from "./CarGrid";

/* Animated Stats Section Component */
function StatsSection() {
  const stats = [
    { value: 15000, suffix: "k+", label: "Happy Customers" },
    { value: 300, suffix: "+", label: "Car Models" },
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
    if (sectionRef.current) observer.observe(sectionRef.current);
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

/* Main HomePage */
export default function HomePage() {
  return (
    <div className="bg-gray-50 text-gray-900">
      {/* Hero Section with Background Video */}
      <section className="relative h-[80vh] flex items-center justify-center text-white overflow-hidden">
        <video
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          poster="/hero-fallback.jpg"
        >
          <source src="/tata-car.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight animate-fadeIn">
            Drive Your Dreams <br /> With Techwheels
          </h1>
          <p
            className="text-xl mb-6 animate-fadeIn"
            style={{ animationDelay: "0.3s" }}
          >
            Welcome To The New Era Of Car Buying.
          </p>
          <a
            href="#cars"
            className="inline-block bg-white text-indigo-700 font-semibold px-6 py-3 rounded-full hover:bg-gray-100 transition animate-fadeIn"
            style={{ animationDelay: "0.6s" }}
          >
            Explore Cars
          </a>
        </div>
      </section>

      {/* Stats Section directly below video */}
      <StatsSection />

      {/* Cars Grid */}
      <section id="cars" className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8 text-center">Our Latest Cars</h2>
        <CarGrid />
      </section>

      {/* Why Choose Techwheels */}
      <section className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-extrabold mb-6">
              Why Choose Techwheels?
            </h2>
            <p className="text-lg mb-8 text-gray-300">
              We’re dedicated to providing a futuristic, innovative driving
              <br />
              experience that exceeds expectations.
            </p>
            <ul className="space-y-6">
              <li className="flex items-start space-x-4">
                <span className="text-green-400 text-2xl">✔</span>
                <div>
                  <h3 className="text-xl font-semibold">
                    Rajasthan’s No.1 Tata Motors Dealership
                  </h3>
                  <p className="text-gray-300">
                    Recognized with the prestigious Diamond Category Award
                    <br />
                    and 5-star rated by leading survey agencies.
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-4">
                <span className="text-green-400 text-2xl">✔</span>
                <div>
                  <h3 className="text-xl font-semibold">
                    Complete Range with Hassle-Free Buying
                  </h3>
                  <p className="text-gray-300">
                    From the latest Tata models to easy finance, affordable EMIs,
                    and transparent deals—TechWheels makes your car-buying
                    journey smooth and stress-free.
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-4">
                <span className="text-green-400 text-2xl">✔</span>
                <div>
                  <h3 className="text-xl font-semibold">
                    Service & Support You Can Count On
                  </h3>
                  <p className="text-gray-300">
                    With skilled technicians, modern workshops, and a strong
                    presence across Jaipur, Ajmer Road, Jagatpura, Shahpura,
                    Paota, Tonk, and Deoli, we keep you worry-free long after the
                    purchase.
                  </p>
                </div>
              </li>
            </ul>
          </div>
          <div className="relative">
            <div className="absolute -top-6 -left-6 w-full h-full bg-purple-500 rounded-3xl transform rotate-3"></div>
            <img
              src="https://scontent.fjai2-5.fna.fbcdn.net/v/t39.30808-6/472954220_1971882736621845_324721772780893747_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=127cfc&_nc_ohc=3rs9oHovHoMQ7kNvwHWSIDd&_nc_oc=AdkXbjoTtaNoaUsh9LQjyX7jlAGvB63oU-zBLC9vqWLUGg-FV9wVYj_YLuzQrEzL20E2QW_Kj4DziDyc7Fajk9n6&_nc_zt=23&_nc_ht=scontent.fjai2-5.fna&_nc_gid=kSiyblCknJSbwfk8_pBQWw&oh=00_AfY6qQl86f8imD_iQtBRFhpwDgOL4HuwhEZsAmA80jZsVQ&oe=68DC744A"
              alt="Car Showcase"
              className="relative rounded-3xl shadow-2xl"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
