# Court_Case_Management

CourtWise Harmony is a modern web application designed to streamline legal case management, communication, and scheduling for legal professionals, clients, and court staff. Built with React, TypeScript, and Firebase, it provides a comprehensive platform for managing the complexities of the legal process.

## ✨ Key Features

*   **Dashboard:** Overview of key metrics, recent cases, messages, and upcoming hearings.
*   **Case Management:**
    *   View, create, and manage legal cases.
    *   Detailed case views including summaries, evidence, and status.
    *   Separate views for plaintiff, defense, and clerk roles.
    *   File new cases electronically.
    *   Manage case requests and defense assignments.
*   **Scheduling:** Manage court schedules and hearings with a flexible calendar view.
*   **Messaging:** Secure communication channels between involved parties (e.g., client-lawyer, lawyer-clerk).
*   **Docket Management:** Access and manage court dockets.
*   **Client Management:** Tools for lawyers to manage their clients.
*   **Lawyer Discovery:** Find and connect with lawyers.
*   **Defendant Tools:** Find cases filed against oneself.
*   **User Authentication & Profiles:** Secure login/registration and profile management.
*   **Firebase Integration:** Leverages Firebase for authentication, database (Firestore likely), and potentially other backend services.
*   **Responsive UI:** Built with Tailwind CSS and Shadcn UI components for a modern and adaptable user interface.
*   **Static Pages:** Includes pages for How It Works, Features, FAQ, Help Center, Legal Policies (Terms, Privacy, Cookies, GDPR), Documentation, and User Guides.

## 💻 Technology Stack

*   **Frontend:** React, TypeScript
*   **Build Tool:** Vite
*   **Routing:** React Router DOM
*   **Styling:** Tailwind CSS, CSS Modules (`App.css`)
*   **UI Components:** Shadcn UI (inferred from `components/ui/`)
*   **State Management:** React Context API (`context/`)
*   **Backend:** Firebase (Authentication, Firestore, potentially others)
*   **Data Fetching/Management:** Custom hooks (`hooks/`), Firebase SDK

## 📂 Project Structure

The `src/` directory contains the core application code, organized as follows:

src/
├── App.css              # Global App-specific styles
├── App.tsx              # Main application component, routing setup
├── components/          # Reusable UI components
│   ├── ui/              # Shadcn UI components
│   └── ...              # Other component folders (e.g., auth, layout, cases)
├── context/             # React Context providers (Auth, Data, Firebase)
├── data/                # Static and mock data (e.g., cases.json, users_*.json)
├── firebase/            # Firebase configuration, services, and helpers
├── hooks/               # Custom React hooks
├── index.css            # Global styles and Tailwind CSS setup
├── integrations/        # Integrations with third-party services (e.g., Supabase)
├── lib/                 # Utility functions (e.g., `cn` for classnames)
├── main.tsx             # Application entry point
├── models/              # Data model definitions
├── pages/               # Page-level components mapped to routes
├── services/            # Business logic and core services (e.g., Notifications)
├── types/               # TypeScript type definitions
├── utils/               # General utilities (e.g., date formatting, validation)
└── vite-env.d.ts        # Vite environment type definitions



## 🚀 Getting Started

Follow these steps to set up and run the project locally:

1.  **Clone the repository:**
    ```bash
    git clone <this-repository-url>
    cd Court_Case_Management
    ```

2.  **Install dependencies:**
    (Using Bun, as `bun.lockb` is present)
    ```bash
    bun install
    ```
    (Alternatively, if using npm)
    ```bash
    npm install
    ```

3.  **Set up Firebase:**
    *   Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
    *   Enable Authentication and Firestore Database.
    *   Obtain your Firebase project configuration (apiKey, authDomain, projectId, etc.).
    *   Add these configuration details to `src/firebase/config.ts`. You might need to create this file or update placeholders if it exists. *Ensure this file is included in your `.gitignore` to avoid committing sensitive keys.*

4.  **Run the development server:**
    ```bash
    bun run dev
    ```
    (Alternatively, if using npm)
    ```bash
    npm run dev
    ```

5.  Open your browser and navigate to `http://localhost:5173` (or the port specified by Vite).

## 🛠️ Available Scripts

*   `bun dev` or `npm run dev`: Starts the development server.
*   `bun build` or `npm run build`: Creates a production build in the `dist/` folder.
*   `bun preview` or `npm run preview`: Serves the production build locally for testing.
*   `bun lint` or `npm run lint`: Lints the codebase (assuming an ESLint script is configured in `package.json`).

## 🤝 Contributing

Contributions are welcome! Please follow standard fork-and-pull-request workflow. (Add more specific contribution guidelines if applicable).

## 📄 License

This project is licensed under the [MIT License](LICENSE). (Choose and add an appropriate license file).
