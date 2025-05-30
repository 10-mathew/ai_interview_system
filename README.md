# RecruitSense - AI-Powered Interview Practice Platform

RecruitSense is a modern web application that provides AI-powered interview practice sessions with personalized feedback. Built with Next.js and TypeScript, it offers a seamless experience for candidates preparing for technical and behavioral interviews.

## Features

- 🤖 **AI-Powered Interviews**: Practice with an intelligent interviewer that adapts to your responses
- 📝 **Customizable Job Roles**: Support for various technical positions including:
  - Frontend Developer
  - Backend Developer
  - Full Stack Developer
  - DevOps Engineer
  - Data Scientist
  - Machine Learning Engineer
  - Software Architect
  - Custom positions with detailed descriptions
- 📄 **CV Integration**: Upload your CV for personalized interview questions
- 🔗 **Shareable Links**: Generate and share interview links with others
- 📊 **Detailed Feedback**: Receive comprehensive feedback on your performance
- 🎯 **Score Breakdown**: Get scores for different aspects of your interview
- 📱 **Responsive Design**: Works seamlessly on all devices

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Database**: Firebase
- **Authentication**: Firebase Auth
- **State Management**: React Hooks
- **Form Handling**: React Hook Form
- **Validation**: Zod

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/10-mathew/ai_interviewsystem.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
app/
├── (root)/
│   ├── page.tsx              # Main landing page
│   ├── share/
│   │   └── [id]/
│   │       └── page.tsx      # Shareable link page
│   └── interview/
│       └── [id]/
│           ├── page.tsx      # Interview session page
│           └── feedback/
│               └── page.tsx  # Interview feedback page
├── components/
│   ├── ui/                   # Reusable UI components
│   └── InterviewCard.tsx     # Interview card component
└── lib/
    ├── actions/             # Server actions
    └── utils/              # Utility functions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Next.js team for the amazing framework
- Radix UI for the accessible components
- Firebase for the backend infrastructure

