# RxBridge: The AI-Powered Productivity Copilot for Pharmacists

## 🚀 Inspiration
Instead of building in a bubble, we started this hackathon by talking to people on the front lines of healthcare—a friend who has done extensive volunteering, an uncle who is an active researcher, and another friend on the front lines of the pharmaceutical industry.  

We asked them one question:  
**"What are the most frustrating, time-wasting logistical chokepoints you see every day?"**  

A powerful theme emerged: the immense productivity drain caused by systemic supply chain failures. The clearest example was the sudden panic of a drug shortage. For a pharmacist, this isn’t a news headline; it’s a 20-minute, high-stress fire drill of manual research, phone calls, and paperwork that grinds their workflow to a halt.  

We saw a critical productivity crisis and were inspired to build a tool that gives pharmacists back their most valuable asset: **time for patient care.**

---

## 💡 What it Does
RxBridge is an intelligent dashboard that transforms the chaos of a supply chain disruption into a **simple, 30-second workflow**. For a busy pharmacist, it:

- **Proactively Detects Disruptions**  
  Scrapes FDA databases for both **drug shortages** and **medical device recalls**, comparing this against the pharmacy’s inventory.  

- **Analyzes Real-World Impact**  
  Uses the industry-standard **Days of Supply** metric with a tiered alert system (🔴 Critical, 🟡 Awareness, 🔵 Routine Reorder).  

- **Provides an Instant, Grounded Solution**  
  A **Gemini-powered agent** suggests valid therapeutic alternatives, then cross-references them against in-stock inventory before presenting them.  

- **Automates the Final Step**  
  With a single click, pharmacists can generate a **concise, professionally formatted draft communication** for the prescribing doctor.  

---

## 🛠 How We Built It
- **Frontend:** React + Vite dashboard, styled with Tailwind CSS, deployed on **Vercel**.  
- **Backend:** FastAPI (Python) server orchestrating agent workflows, deployed on **Railway**.  
- **AI & Data Pipeline:** BeautifulSoup (scraping), Pandas (data manipulation), Rapidfuzz (fuzzy matching), and Gemini API (intelligence).  
- **Database:** PostgreSQL hosted on **Supabase** for inventory + alert history.  

We focused on real-world practicality: real data, zero PHI, and strict prompt engineering for reliability.  

---

## 🎯 Track Alignment
- **Productivity Track**: Automates the most chaotic part of a pharmacist’s workflow → reduced overload, improved focus on patient care.  
- **Commure Challenge**: Simplifies complex workflows, aligning with the mission to **make healthcare simpler and more reliable**.  
- **Gemini API Challenge**: Uses Gemini both to **analyze info** (suggest alternatives) and **generate content** (draft professional communication).  

---

## ⚡ Challenges We Faced
- **Data Inconsistency**: Drug names didn’t match across FDA data and inventory (`"Acetaminophen"` vs. `"Acetaminophen 500mg Tablet"`). Solved with **Rapidfuzz** for fuzzy matching.  
- **Prompt Reliability**: Engineering a safe, expert pharmacist persona for Gemini was critical to ensuring accurate and clinically safe responses.  

---

## 🏆 Accomplishments We’re Proud Of
- Built a **full end-to-end agentic workflow** in under a hackathon timeline.  
- Created a **tiered alert system** pharmacists can trust, grounded in the **Days of Supply** metric.  
- Solved a real-world problem while maintaining **privacy-first design** (zero PHI).  

---

## 📚 What We Learned
- Start with the **user’s pain points**, not the tech.  
- Deep empathy + user-first design = **solutions that actually matter**.  
- The value of tight integration between **data, AI, and workflow automation**.  

---

## 🔮 What’s Next
- Real-time alerts and tighter integrations with major **Pharmacy Management Systems (PMS)**.  
- Expansion into broader supply chain monitoring.  
- Continuous refinement of the AI agent to cover more pharmacist workflows.  

---

## 📸 Demo Screenshots
*(Add screenshots or a demo video link here if available.)*  

---

## ⚙️ Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Vercel  
- **Backend:** FastAPI, Railway  
- **Database:** PostgreSQL, Supabase  
- **AI & Data:** Gemini API, BeautifulSoup, Pandas, Rapidfuzz