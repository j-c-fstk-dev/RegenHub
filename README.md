# RegenImpactHub

> Where Regenerative Action Becomes Verifiable Impact.

RegenImpactHub is an open-source platform designed to make local regenerative efforts visible, verifiable, and valuable. It addresses the challenge that countless positive environmental and social actions go unseen and unrecorded by providing tools to track, validate, and showcase this crucial work.

Our mission is to build a global, public registry of grassroots regenerative action, shifting the narrative from extractive to restorative and empowering individuals and communities to demonstrate their positive impact.

## The Problem

- **Invisibility:** Countless regenerative actions happen daily but remain invisible to the wider world.
- **Lack of Credibility:** Grassroots initiatives struggle to prove their impact, hindering their ability to gain support, funding, and recognition.
- **Fragmentation:** Isolated efforts lack a unified platform to connect, create a collective story, and demonstrate a larger movement.

## The Solution

RegenImpactHub provides a simple yet powerful framework to turn actions into trusted impact data.

- A **public, verifiable registry** of regenerative actions.
- A **hybrid validation system** combining AI pre-checks with human oversight to build trust.
- **Digital Impact Certificates** for each approved action, creating a shareable record of contribution.
- **Public profiles** for organizations and projects to showcase their verified track record.

## Key Features

- **Organization & Project Management:** Users can create and manage their own organizations and the projects within them.
- **Action Submission Wizard:** An intuitive, step-by-step guide to register new regenerative actions with descriptions, locations, and evidence.
- **AI-Assisted Validation:** Submissions are first analyzed by an AI assistant for completeness and potential flags, preparing them for efficient human review.
- **Admin Verification Panel:** A dedicated interface for administrators to review, score, and approve submitted actions, certifying them.
- **Public Impact Wall:** A global map and feed showcasing all verified regenerative actions, filterable by category and location.
- **Certificate & Profile Pages:** Every action and organization has a unique, shareable public page to display their verified impact.
- **LEAP Module for SMEs:** A guided assessment based on the TNFD framework to help Small and Medium-sized Enterprises understand and manage their dependencies and impacts on nature.

## How It Works

1.  **Create Identity:** A user signs up and creates an Organization and a Project.
2.  **Submit Action:** The user performs a regenerative action and uses the wizard to submit a report with details and evidence (e.g., a link to a photo or blog post).
3.  **AI Pre-Check:** A Genkit AI flow automatically analyzes the submission, provides a summary, suggests a score, and flags potential issues.
4.  **Human Verification:** An administrator reviews the AI analysis and the submission details, assigning a final score and approving the action.
5.  **Certification:** Upon approval, a permanent digital Impact Certificate is created for the action.
6.  **Showcase Impact:** The verified action appears on the Public Impact Wall and the organization's public profile, contributing to their track record.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Database & Auth:** [Firebase](https://firebase.google.com/) (Firestore, Authentication, Storage)
- **Generative AI:** [Genkit (Google AI)](https://firebase.google.com/docs/genkit)
- **UI:** [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Components:** [ShadCN UI](https://ui.shadcn.com/)
- **Deployment:** Firebase App Hosting

## API Endpoints

The application exposes several serverless API routes for handling core functionality:

- `POST /api/submit`: Submits a new action. Requires authentication. Kicks off the AI verification flow.
- `GET /api/wall`: Retrieves verified actions for the public Impact Wall.
- `GET /api/org/[slug]`: Retrieves a specific organization's public profile and its verified actions.
- `GET /api/action/[actionId]`: Retrieves the data for a specific certified action.

## Roadmap

This is just the beginning. Our vision is to evolve RegenImpactHub into a core piece of public infrastructure for the regenerative movement.

#### 🗓️ MVP Launch (October–November 2025)
- [x] User Authentication & Organization Management
- [x] Project and Action Submission Flow
- [x] AI-Assisted + Human Verification Workflow
- [x] Public Impact Wall and Certificate Pages

#### 🗓️ Personalization & Reporting (December 2025 – March 2026)
- Personal dashboards for users and organizations.
- PDF export functionality for impact reports.
- Advanced filtering and search capabilities.
- Mobile-first optimization.

#### 🗓️ Ecosystem Integration (Mid-2026)
- Integrations with Web3 ecosystems (e.g., Gitcoin, Celo).
- Optional NFT minting for verified impact certificates.
- Partnerships with DAOs and ReFi projects to link impact to funding.

#### 🗓️ Long-Term: Public Infrastructure
- Evolve RegenImpactHub into a decentralized public good.
- Establish verified actions as a form of reputational credential.
- Open up the aggregated, anonymized data for global environmental research.

## Contributing

This project is open-source and community-driven. We welcome contributions of all forms, from code and design to feedback and testing. Please refer to the project's issues for areas where you can help.

## License

This project is licensed under the **MIT License**.

---

Copyright (c) 2024 BeRegen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
